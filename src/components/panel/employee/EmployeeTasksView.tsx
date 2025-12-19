import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Task, TaskAssignment, TaskStatus, TaskPriority, Profile, SmsCodeRequest } from '@/types/panel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useTabContext } from '@/components/panel/EmployeeDashboard';
import { checkRateLimit, recordAttempt, formatRetryTime } from '@/lib/rate-limiter';
import { 
  Calendar, User, Euro, AlertCircle, MessageSquare, CheckCircle2, 
  FileUp, Mail, Key, UserCheck, ArrowUpRight, HandMetal, Undo2, Clock, Trophy, PartyPopper, Eye, EyeOff, RefreshCw
} from 'lucide-react';
import { format, formatDistanceStrict } from 'date-fns';
import { de } from 'date-fns/locale';

// SMS Code Display Component - shows code multiple times with resend option
function SmsCodeDisplay({ 
  smsCode,
  onResendCode,
  isResending
}: { 
  smsCode: string;
  onResendCode: () => void;
  isResending: boolean;
}) {
  const [isRevealed, setIsRevealed] = useState(false);

  return (
    <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
      <p className="text-xs font-semibold text-purple-700 dark:text-purple-400 mb-2 uppercase tracking-wide">
        SMS-Code erhalten
      </p>
      {!isRevealed ? (
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => setIsRevealed(true)}
            variant="outline"
            className="gap-2 border-purple-500/50 text-purple-600 hover:bg-purple-500/10"
          >
            <Eye className="h-4 w-4" />
            Code anzeigen
          </Button>
          <Button
            onClick={onResendCode}
            variant="outline"
            disabled={isResending}
            className="gap-2 border-purple-500/50 text-purple-600 hover:bg-purple-500/10"
          >
            <RefreshCw className={`h-4 w-4 ${isResending ? 'animate-spin' : ''}`} />
            Neuen Code anfordern
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-3xl font-mono font-bold text-purple-700 dark:text-purple-400 tracking-widest">
            {smsCode}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setIsRevealed(false)}
              variant="ghost"
              size="sm"
              className="gap-2 text-purple-600 hover:bg-purple-500/10"
            >
              <EyeOff className="h-4 w-4" />
              Ausblenden
            </Button>
            <Button
              onClick={onResendCode}
              variant="ghost"
              size="sm"
              disabled={isResending}
              className="gap-2 text-purple-600 hover:bg-purple-500/10"
            >
              <RefreshCw className={`h-4 w-4 ${isResending ? 'animate-spin' : ''}`} />
              Neuen Code anfordern
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

const priorityConfig: Record<TaskPriority, { color: string; label: string; icon: string }> = {
  low: { color: 'bg-slate-500/20 text-slate-700 dark:text-slate-300 border border-slate-500/30 !font-bold', label: 'Niedrig', icon: '○' },
  medium: { color: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border border-yellow-500/30 !font-bold', label: 'Mittel', icon: '◐' },
  high: { color: 'bg-red-100 text-red-800 dark:bg-red-600/30 dark:text-red-300 border border-red-400 dark:border-red-500/50 !font-bold animate-priority-pulse', label: 'Hoch', icon: '●' },
  urgent: { color: 'bg-red-200 text-red-900 dark:bg-red-700/40 dark:text-red-200 border border-red-500 dark:border-red-600/60 !font-bold animate-priority-pulse', label: 'Dringend', icon: '⬤' }
};

const statusConfig: Record<TaskStatus, { color: string; label: string }> = {
  pending: { color: 'bg-muted text-muted-foreground', label: 'Offen' },
  assigned: { color: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400', label: 'Zugewiesen' },
  in_progress: { color: 'bg-blue-500/20 text-blue-700 dark:text-blue-400', label: 'In Bearbeitung' },
  sms_requested: { color: 'bg-purple-500/20 text-purple-700 dark:text-purple-400', label: 'SMS angefordert' },
  completed: { color: 'bg-green-500/20 text-green-700 dark:text-green-400', label: 'Abgeschlossen' },
  cancelled: { color: 'bg-destructive/20 text-destructive', label: 'Storniert' }
};

export default function EmployeeTasksView() {
  const [tasks, setTasks] = useState<(Task & { assignment?: TaskAssignment; assignedBy?: Profile; smsRequest?: SmsCodeRequest })[]>([]);
  const [progressNotes, setProgressNotes] = useState<Record<string, string>>({});
  const [completionDialog, setCompletionDialog] = useState<{
    open: boolean;
    task: (Task & { assignment?: TaskAssignment }) | null;
    duration: string;
  }>({ open: false, task: null, duration: '' });
  const [resendingCode, setResendingCode] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const tabContext = useTabContext();

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
          const assignedBy = profilesRes.data?.find((p: any) => p.user_id === task.created_by);
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

  const handleAcceptTask = async (taskId: string) => {
    // Use secure server-side function that properly updates task status
    const { error } = await supabase.rpc('accept_task', { _task_id: taskId });
    
    if (error) {
      toast({ title: 'Fehler', description: 'Auftrag konnte nicht angenommen werden.', variant: 'destructive' });
    } else {
      toast({ title: 'Auftrag übernommen!', description: 'Du bist jetzt für diesen Auftrag verantwortlich.' });
      fetchTasks();
    }
  };

  const handleReturnTask = async (taskId: string) => {
    // Delete the assignment completely so task disappears from employee view
    await supabase.from('task_assignments').delete().eq('task_id', taskId).eq('user_id', user?.id);
    await supabase.from('tasks').update({ status: 'pending' }).eq('id', taskId);
    toast({ title: 'Auftrag abgegeben', description: 'Der Auftrag wurde zurückgegeben.' });
    fetchTasks();
  };

  const handleRequestSms = async (taskId: string) => {
    // Rate limit SMS code requests - 1 per 5 minutes per task
    const rateLimitKey = `sms:${user?.id}:${taskId}`;
    const { allowed, retryAfterMs } = checkRateLimit(rateLimitKey, 'smsRequest');
    
    if (!allowed) {
      const retryTime = formatRetryTime(retryAfterMs);
      toast({ 
        title: 'Bitte warten', 
        description: `Du kannst in ${retryTime} erneut einen Code anfordern.`, 
        variant: 'destructive' 
      });
      return;
    }
    
    // Record the attempt
    recordAttempt(rateLimitKey);
    
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

  const handleResendSmsCode = async (taskId: string, existingRequestId: string) => {
    setResendingCode(taskId);
    
    // Rate limit SMS code requests - 1 per 5 minutes per task
    const rateLimitKey = `sms:${user?.id}:${taskId}`;
    const { allowed, retryAfterMs } = checkRateLimit(rateLimitKey, 'smsRequest');
    
    if (!allowed) {
      const retryTime = formatRetryTime(retryAfterMs);
      toast({ 
        title: 'Bitte warten', 
        description: `Du kannst in ${retryTime} erneut einen Code anfordern.`, 
        variant: 'destructive' 
      });
      setResendingCode(null);
      return;
    }
    
    // Record the attempt
    recordAttempt(rateLimitKey);
    
    // Update existing request - clear the old code and set status to pending
    const { error } = await supabase
      .from('sms_code_requests')
      .update({ 
        sms_code: null, 
        status: 'pending',
        requested_at: new Date().toISOString()
      })
      .eq('id', existingRequestId);

    if (error) {
      toast({ title: 'Fehler', description: 'Neuer SMS-Code konnte nicht angefordert werden.', variant: 'destructive' });
    } else {
      toast({ title: 'Erfolg', description: 'Neuer SMS-Code wurde angefordert.' });
      fetchTasks();
    }
    setResendingCode(null);
  };

  const handleCompleteTask = async (task: Task & { assignment?: TaskAssignment }) => {
    // Calculate duration since task was accepted
    const acceptedAt = task.assignment?.accepted_at || task.assignment?.assigned_at;
    let duration = 'Unbekannt';
    if (acceptedAt) {
      duration = formatDistanceStrict(new Date(acceptedAt), new Date(), { locale: de });
    }
    
    const notes = progressNotes[task.id] || '';
    await supabase.from('tasks').update({ status: 'completed' }).eq('id', task.id);
    await supabase.from('task_assignments').update({ 
      status: 'completed', 
      progress_notes: notes 
    }).eq('task_id', task.id).eq('user_id', user?.id);
    
    // Show completion dialog with stats and praise
    setCompletionDialog({
      open: true,
      task,
      duration
    });
    
    fetchTasks();
  };

  const handleUpdateNotes = async (taskId: string) => {
    const notes = progressNotes[taskId] || '';
    await supabase.from('task_assignments').update({ progress_notes: notes })
      .eq('task_id', taskId).eq('user_id', user?.id);
    toast({ title: 'Gespeichert', description: 'Notizen aktualisiert.' });
  };

  const handleGoToDocuments = () => {
    if (tabContext) {
      tabContext.setActiveTab('documents');
    }
  };

  // Only show active tasks - completed tasks are shown in profile history
  const activeTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled');

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Meine Aufträge</h2>
          <p className="text-muted-foreground mt-1">
            {activeTasks.length} aktive Aufträge
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
          {activeTasks.map((task) => {
            const isHighPriority = task.priority === 'high' || task.priority === 'urgent';
            return (
            <Card key={task.id} className={`glass-card overflow-hidden transition-all hover:shadow-glow ${
              isHighPriority ? 'neon-border' : ''
            }`}>
              <div className={`h-1.5 ${
                task.priority === 'urgent' ? 'bg-gradient-to-r from-red-600 via-red-500 to-red-600 animate-pulse' :
                task.priority === 'high' ? 'bg-gradient-to-r from-red-500 to-red-600' :
                task.priority === 'medium' ? 'bg-gradient-to-r from-yellow-500 to-amber-500' : 'bg-muted'
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
                  {task.deadline && !isNaN(new Date(task.deadline).getTime()) && (
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
                  <SmsCodeDisplay 
                    smsCode={task.smsRequest.sms_code} 
                    onResendCode={() => handleResendSmsCode(task.id, task.smsRequest!.id)}
                    isResending={resendingCode === task.id}
                  />
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
                        {task.status === 'assigned' && !task.assignment?.accepted_at ? (
                          <Button 
                            onClick={() => handleAcceptTask(task.id)} 
                            size="lg"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                          >
                            Auftrag annehmen
                          </Button>
                        ) : task.assignment?.accepted_at && (
                          <Button 
                            disabled
                            size="lg"
                            className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/40 cursor-default opacity-80"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Angenommen
                          </Button>
                        )}
                        {(task.status === 'in_progress' || task.status === 'sms_requested') && (
                          <>
                            {!task.smsRequest && (
                              <Button 
                                variant="outline" 
                                onClick={() => handleRequestSms(task.id)}
                                className="border-purple-500/50 text-purple-600 hover:bg-purple-500/10"
                              >
                                SMS-Code Anfragen
                              </Button>
                            )}
                            {task.smsRequest && task.smsRequest.status === 'pending' && (
                              <Badge className="bg-purple-500/20 text-purple-700 dark:text-purple-400 py-2 px-3">
                                SMS-Code angefordert - warte auf Antwort...
                              </Badge>
                            )}
                            <Button 
                              onClick={handleGoToDocuments} 
                              variant="neon"
                              className="gap-2"
                            >
                              <FileUp className="h-4 w-4" />
                              Dokumente hochladen
                            </Button>
                            <Button 
                              onClick={() => handleCompleteTask(task)} 
                              className="bg-green-600 hover:bg-green-700 gap-2"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              Abgeben
                            </Button>
                          </>
                        )}
                        <Button 
                          variant="glass" 
                          onClick={() => handleUpdateNotes(task.id)}
                        >
                          Notizen speichern
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )})}
        </div>
      )}

      {/* Completion Dialog with Stats and Praise */}
      <Dialog open={completionDialog.open} onOpenChange={(open) => setCompletionDialog({ ...completionDialog, open })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <PartyPopper className="h-6 w-6 text-yellow-500" />
              Hervorragende Arbeit!
            </DialogTitle>
            <DialogDescription>
              Du hast den Auftrag erfolgreich abgeschlossen
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="text-center">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-green-500/30">
                <Trophy className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-bold">{completionDialog.task?.title}</h3>
              <p className="text-muted-foreground">{completionDialog.task?.customer_name}</p>
            </div>
            
            <div className="p-4 bg-muted/50 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Bearbeitungszeit
                </span>
                <span className="font-bold text-lg">{completionDialog.duration}</span>
              </div>
              {completionDialog.task?.special_compensation && completionDialog.task.special_compensation > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Euro className="h-4 w-4" />
                    Sondervergütung
                  </span>
                  <span className="font-bold text-lg text-emerald-600">{completionDialog.task.special_compensation.toFixed(2)} €</span>
                </div>
              )}
            </div>
            
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Vergiss nicht, deine Dokumente hochzuladen!
              </p>
              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  onClick={() => setCompletionDialog({ ...completionDialog, open: false })}
                >
                  Schließen
                </Button>
                <Button
                  onClick={() => {
                    setCompletionDialog({ ...completionDialog, open: false });
                    handleGoToDocuments();
                  }}
                  className="bg-primary gap-2"
                >
                  <FileUp className="h-4 w-4" />
                  Dokumente hochladen
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
