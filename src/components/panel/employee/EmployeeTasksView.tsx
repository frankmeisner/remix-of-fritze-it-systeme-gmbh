import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Task, TaskAssignment, TaskStatus, TaskPriority, Profile, SmsCodeRequest } from '@/types/panel';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { 
  Calendar, User, Euro, AlertCircle, Play, MessageSquare, CheckCircle, 
  Clock, FileText, Mail, Key, UserCheck, Phone
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const priorityConfig: Record<TaskPriority, { color: string; label: string; icon: string }> = {
  low: { color: 'bg-slate-500/20 text-slate-700 dark:text-slate-300 border-slate-500/30', label: 'Niedrig', icon: '○' },
  medium: { color: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30', label: 'Mittel', icon: '◐' },
  high: { color: 'bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-500/30', label: 'Hoch', icon: '●' },
  urgent: { color: 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30', label: 'Dringend', icon: '⬤' }
};

const statusConfig: Record<TaskStatus, { color: string; label: string }> = {
  pending: { color: 'bg-gray-500/20 text-gray-700 dark:text-gray-400', label: 'Offen' },
  assigned: { color: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400', label: 'Zugewiesen' },
  in_progress: { color: 'bg-blue-500/20 text-blue-700 dark:text-blue-400', label: 'In Bearbeitung' },
  sms_requested: { color: 'bg-purple-500/20 text-purple-700 dark:text-purple-400', label: 'SMS angefordert' },
  completed: { color: 'bg-green-500/20 text-green-700 dark:text-green-400', label: 'Abgeschlossen' },
  cancelled: { color: 'bg-red-500/20 text-red-700 dark:text-red-400', label: 'Storniert' }
};

export default function EmployeeTasksView() {
  const [tasks, setTasks] = useState<(Task & { assignment?: TaskAssignment; assignedBy?: Profile; smsRequest?: SmsCodeRequest })[]>([]);
  const [progressNotes, setProgressNotes] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchTasks();

      const channel = supabase
        .channel('employee-tasks')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, fetchTasks)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'task_assignments' }, fetchTasks)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'sms_code_requests' }, fetchTasks)
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchTasks = async () => {
    if (!user) return;

    const { data: assignments } = await supabase
      .from('task_assignments')
      .select('*')
      .eq('user_id', user.id);

    if (assignments && assignments.length > 0) {
      const taskIds = assignments.map(a => a.task_id);
      
      const [tasksRes, profilesRes, smsRes] = await Promise.all([
        supabase.from('tasks').select('*').in('id', taskIds).order('deadline', { ascending: true }),
        supabase.from('profiles').select('*'),
        supabase.from('sms_code_requests').select('*').in('task_id', taskIds).eq('user_id', user.id)
      ]);

      if (tasksRes.data) {
        const enrichedTasks = tasksRes.data.map(task => {
          const assignment = assignments.find(a => a.task_id === task.id);
          const assignedBy = profilesRes.data?.find((p: Profile) => p.user_id === task.created_by);
          const smsRequest = smsRes.data?.find(s => s.task_id === task.id);
          return {
            ...task as Task,
            assignment: assignment as TaskAssignment | undefined,
            assignedBy: assignedBy as Profile | undefined,
            smsRequest: smsRequest as SmsCodeRequest | undefined
          };
        });
        setTasks(enrichedTasks);
      }
    } else {
      setTasks([]);
    }
  };

  const handleStartTask = async (taskId: string) => {
    await supabase.from('tasks').update({ status: 'in_progress' }).eq('id', taskId);
    await supabase.from('task_assignments').update({ 
      accepted_at: new Date().toISOString(), 
      status: 'in_progress' 
    }).eq('task_id', taskId).eq('user_id', user?.id);
    toast({ title: 'Erfolg', description: 'Auftrag gestartet.' });
    fetchTasks();
  };

  const handleRequestSms = async (taskId: string) => {
    const { error } = await supabase.from('sms_code_requests').insert({
      task_id: taskId,
      user_id: user?.id
    });

    if (error) {
      toast({ title: 'Fehler', description: 'SMS-Anfrage fehlgeschlagen.', variant: 'destructive' });
    } else {
      await supabase.from('tasks').update({ status: 'sms_requested' }).eq('id', taskId);
      toast({ title: 'Erfolg', description: 'SMS-Code wurde angefordert.' });
      fetchTasks();
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    const notes = progressNotes[taskId] || '';
    await supabase.from('tasks').update({ status: 'completed' }).eq('id', taskId);
    await supabase.from('task_assignments').update({ 
      status: 'completed', 
      progress_notes: notes 
    }).eq('task_id', taskId).eq('user_id', user?.id);
    toast({ title: 'Erfolg', description: 'Auftrag abgeschlossen!' });
    fetchTasks();
  };

  const handleUpdateNotes = async (taskId: string) => {
    const notes = progressNotes[taskId] || '';
    await supabase.from('task_assignments').update({ progress_notes: notes })
      .eq('task_id', taskId).eq('user_id', user?.id);
    toast({ title: 'Gespeichert', description: 'Notizen aktualisiert.' });
  };

  const activeTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Meine Aufträge</h2>
          <p className="text-muted-foreground mt-1">
            {activeTasks.length} aktiv • {completedTasks.length} abgeschlossen
          </p>
        </div>
      </div>

      {tasks.length === 0 ? (
        <Card className="shadow-lg border-dashed">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Keine Aufträge</h3>
            <p className="text-muted-foreground">Dir wurden noch keine Aufträge zugewiesen.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {activeTasks.map((task) => (
            <Card key={task.id} className="shadow-lg overflow-hidden">
              <div className={`h-1 ${
                task.priority === 'urgent' ? 'bg-red-500' :
                task.priority === 'high' ? 'bg-orange-500' :
                task.priority === 'medium' ? 'bg-yellow-500' : 'bg-slate-400'
              }`} />
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="space-y-2">
                    <CardTitle className="text-xl">{task.title}</CardTitle>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={`${priorityConfig[task.priority].color} border font-medium`}>
                        {priorityConfig[task.priority].icon} {priorityConfig[task.priority].label}
                      </Badge>
                      <Badge className={statusConfig[task.status].color}>
                        {statusConfig[task.status].label}
                      </Badge>
                      {task.special_compensation && task.special_compensation > 0 && (
                        <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                          <Euro className="h-3 w-3 mr-1" />
                          {task.special_compensation.toFixed(2)} €
                        </Badge>
                      )}
                    </div>
                  </div>
                  {task.assignedBy && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 rounded-lg text-sm">
                      <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-emerald-700 dark:text-emerald-400">
                        Zugewiesen von {task.assignedBy.first_name}
                      </span>
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {task.description && (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm leading-relaxed">{task.description}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate">{task.customer_name}</span>
                  </div>
                  {task.deadline && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>{format(new Date(task.deadline), 'dd.MM.yyyy HH:mm', { locale: de })}</span>
                    </div>
                  )}
                </div>

                {(task.test_email || task.test_password) && (
                  <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-3 uppercase tracking-wide">
                      Test-Zugangsdaten
                    </p>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {task.test_email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <span className="font-mono">{task.test_email}</span>
                        </div>
                      )}
                      {task.test_password && (
                        <div className="flex items-center gap-2 text-sm">
                          <Key className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <span className="font-mono">{task.test_password}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {task.smsRequest?.sms_code && (
                  <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                    <p className="text-xs font-semibold text-purple-700 dark:text-purple-400 mb-2 uppercase tracking-wide">
                      SMS-Code erhalten
                    </p>
                    <p className="text-3xl font-mono font-bold text-purple-700 dark:text-purple-400 tracking-widest">
                      {task.smsRequest.sms_code}
                    </p>
                  </div>
                )}

                {task.status !== 'completed' && task.status !== 'cancelled' && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <Textarea
                        placeholder="Fortschritt und Notizen hier eingeben..."
                        value={progressNotes[task.id] || task.assignment?.progress_notes || ''}
                        onChange={(e) => setProgressNotes({ ...progressNotes, [task.id]: e.target.value })}
                        className="min-h-[100px] resize-none"
                      />
                      <div className="flex flex-wrap gap-3">
                        {task.status === 'assigned' && (
                          <Button 
                            onClick={() => handleStartTask(task.id)} 
                            className="gap-2 bg-blue-600 hover:bg-blue-700"
                          >
                            <Play className="h-4 w-4" />
                            Auftrag starten
                          </Button>
                        )}
                        {(task.status === 'in_progress' || task.status === 'sms_requested') && (
                          <>
                            {task.status === 'in_progress' && !task.smsRequest && (
                              <Button 
                                variant="outline" 
                                onClick={() => handleRequestSms(task.id)} 
                                className="gap-2"
                              >
                                <MessageSquare className="h-4 w-4" />
                                SMS anfordern
                              </Button>
                            )}
                            <Button 
                              onClick={() => handleCompleteTask(task.id)} 
                              className="gap-2 bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Auftrag abschließen
                            </Button>
                          </>
                        )}
                        <Button 
                          variant="secondary" 
                          onClick={() => handleUpdateNotes(task.id)}
                          className="gap-2"
                        >
                          <FileText className="h-4 w-4" />
                          Notizen speichern
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
