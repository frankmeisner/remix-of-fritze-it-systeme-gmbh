import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Task, TaskAssignment, Profile, TaskStatus, TaskPriority } from '@/types/panel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Calendar, User, Phone, Euro, AlertCircle, Mail, Key, Activity, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const priorityColors: Record<TaskPriority, string> = {
  low: 'bg-slate-500/20 text-slate-700 dark:text-slate-300 border border-slate-500/30',
  medium: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border border-yellow-500/30',
  high: 'bg-red-500/20 text-red-700 dark:text-red-400 border border-red-500/30',
  urgent: 'bg-red-600/30 text-red-700 dark:text-red-400 border border-red-600/50'
};

const statusColors: Record<TaskStatus, string> = {
  pending: 'bg-gray-500/20 text-gray-700 dark:text-gray-400',
  assigned: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400',
  in_progress: 'bg-blue-500/20 text-blue-700 dark:text-blue-400',
  sms_requested: 'bg-purple-500/20 text-purple-700 dark:text-purple-400',
  completed: 'bg-green-500/20 text-green-700 dark:text-green-400',
  cancelled: 'bg-red-500/20 text-red-700 dark:text-red-400'
};

const statusLabels: Record<TaskStatus, string> = {
  pending: 'Offen',
  assigned: 'Zugewiesen',
  in_progress: 'In Bearbeitung',
  sms_requested: 'SMS angefordert',
  completed: 'Abgeschlossen',
  cancelled: 'Storniert'
};

export default function AdminTasksView() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [assignments, setAssignments] = useState<(TaskAssignment & { progress_notes?: string })[]>([]);
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    customer_name: '',
    customer_phone: '',
    deadline: '',
    priority: 'medium' as TaskPriority,
    special_compensation: '',
    test_email: '',
    test_password: ''
  });

  useEffect(() => {
    fetchTasks();
    fetchEmployees();

    // Realtime subscription for live updates
    const channel = supabase
      .channel('admin-tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        fetchTasks();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_assignments' }, () => {
        fetchTasks();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchTasks = async () => {
    const { data: tasksData } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (tasksData) {
      setTasks(tasksData as Task[]);
    }

    const { data: assignmentsData } = await supabase
      .from('task_assignments')
      .select('*');

    if (assignmentsData) {
      setAssignments(assignmentsData as TaskAssignment[]);
    }
  };

  const fetchEmployees = async () => {
    const { data: rolesData } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'employee');

    if (rolesData && rolesData.length > 0) {
      const userIds = rolesData.map(r => r.user_id);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', userIds);

      if (profilesData) {
        setEmployees(profilesData as unknown as Profile[]);
      }
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.title || !newTask.customer_name) {
      toast({ title: 'Fehler', description: 'Titel und Kundenname sind Pflichtfelder.', variant: 'destructive' });
      return;
    }

    const { error } = await supabase.from('tasks').insert({
      title: newTask.title,
      description: newTask.description || null,
      customer_name: newTask.customer_name,
      customer_phone: newTask.customer_phone || null,
      deadline: newTask.deadline || null,
      priority: newTask.priority,
      special_compensation: newTask.special_compensation ? parseFloat(newTask.special_compensation) : null,
      test_email: newTask.test_email || null,
      test_password: newTask.test_password || null,
      created_by: user?.id
    });

    if (error) {
      toast({ title: 'Fehler', description: 'Auftrag konnte nicht erstellt werden.', variant: 'destructive' });
    } else {
      toast({ title: 'Erfolg', description: 'Auftrag wurde erstellt.' });
      setIsDialogOpen(false);
      setNewTask({ title: '', description: '', customer_name: '', customer_phone: '', deadline: '', priority: 'medium', special_compensation: '', test_email: '', test_password: '' });
      fetchTasks();
    }
  };

  const handleAssignTask = async () => {
    if (!selectedTask || !selectedEmployee) {
      toast({ title: 'Fehler', description: 'Bitte Mitarbeiter auswählen.', variant: 'destructive' });
      return;
    }

    const { error } = await supabase.from('task_assignments').insert({
      task_id: selectedTask.id,
      user_id: selectedEmployee
    });

    if (error) {
      toast({ title: 'Fehler', description: 'Zuweisung fehlgeschlagen.', variant: 'destructive' });
    } else {
      await supabase.from('tasks').update({ status: 'assigned' }).eq('id', selectedTask.id);
      toast({ title: 'Erfolg', description: 'Auftrag wurde zugewiesen.' });
      setIsAssignDialogOpen(false);
      setSelectedTask(null);
      setSelectedEmployee('');
      fetchTasks();
    }
  };

  const getTaskAssignee = (taskId: string) => {
    const assignment = assignments.find(a => a.task_id === taskId);
    if (!assignment) return null;
    return employees.find(e => e.user_id === assignment.user_id);
  };

  const getTaskAssignment = (taskId: string) => {
    return assignments.find(a => a.task_id === taskId);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Aufträge verwalten</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Neuer Auftrag
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Neuen Auftrag erstellen</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Titel *</Label>
                <Input value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} placeholder="Auftragstitel" />
              </div>
              <div className="space-y-2">
                <Label>Beschreibung</Label>
                <Textarea value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} placeholder="Auftragsdetails..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Kundenname *</Label>
                  <Input value={newTask.customer_name} onChange={(e) => setNewTask({ ...newTask, customer_name: e.target.value })} placeholder="Max Mustermann" />
                </div>
                <div className="space-y-2">
                  <Label>Telefon</Label>
                  <Input value={newTask.customer_phone} onChange={(e) => setNewTask({ ...newTask, customer_phone: e.target.value })} placeholder="+49 123 456789" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Deadline</Label>
                  <Input type="datetime-local" value={newTask.deadline} onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Priorität</Label>
                  <Select value={newTask.priority} onValueChange={(v) => setNewTask({ ...newTask, priority: v as TaskPriority })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Niedrig</SelectItem>
                      <SelectItem value="medium">Mittel</SelectItem>
                      <SelectItem value="high">Hoch</SelectItem>
                      <SelectItem value="urgent">Dringend</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Sondervergütung (€)</Label>
                <Input type="number" step="0.01" value={newTask.special_compensation} onChange={(e) => setNewTask({ ...newTask, special_compensation: e.target.value })} placeholder="0.00" />
              </div>
              <div className="border-t pt-4 mt-4">
                <p className="text-sm font-medium mb-3 text-muted-foreground">Test-Zugangsdaten (Optional)</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Test E-Mail</Label>
                    <Input type="email" value={newTask.test_email} onChange={(e) => setNewTask({ ...newTask, test_email: e.target.value })} placeholder="test@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label>Test Passwort</Label>
                    <Input type="text" value={newTask.test_password} onChange={(e) => setNewTask({ ...newTask, test_password: e.target.value })} placeholder="Passwort123" />
                  </div>
                </div>
              </div>
              <Button onClick={handleCreateTask} className="w-full">Auftrag erstellen</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {tasks.map((task) => {
          const assignee = getTaskAssignee(task.id);
          const assignment = getTaskAssignment(task.id);
          return (
            <Card key={task.id} className="shadow-card overflow-hidden">
              <div className={`h-2 ${
                task.priority === 'urgent' ? 'bg-red-600' :
                task.priority === 'high' ? 'bg-red-500' :
                task.priority === 'medium' ? 'bg-yellow-500' : 'bg-slate-400'
              }`} />
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{task.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge className={priorityColors[task.priority]}>
                        {task.priority === 'low' ? '○ Niedrig' : task.priority === 'medium' ? '◐ Mittel' : task.priority === 'high' ? '● Hoch' : '⬤ Dringend'}
                      </Badge>
                      <Badge className={statusColors[task.status]}>
                        {statusLabels[task.status]}
                      </Badge>
                      {task.special_compensation && (
                        <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                          <Euro className="h-3 w-3 mr-1" />
                          {task.special_compensation.toFixed(2)} €
                        </Badge>
                      )}
                    </div>
                  </div>
                  {!assignee && task.status === 'pending' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedTask(task);
                        setIsAssignDialogOpen(true);
                      }}
                    >
                      Zuweisen
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  {task.description && <p className="text-muted-foreground">{task.description}</p>}
                  <div className="flex flex-wrap gap-4 text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {task.customer_name}
                    </span>
                    {task.customer_phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {task.customer_phone}
                      </span>
                    )}
                    {task.deadline && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(task.deadline), 'dd.MM.yyyy HH:mm', { locale: de })}
                      </span>
                    )}
                  </div>
                  {(task.test_email || task.test_password) && (
                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-md">
                      <p className="text-xs font-medium mb-2 text-blue-700 dark:text-blue-400">Test-Zugangsdaten</p>
                      <div className="flex flex-wrap gap-4">
                        {task.test_email && (
                          <span className="flex items-center gap-1 text-sm">
                            <Mail className="h-4 w-4" />
                            {task.test_email}
                          </span>
                        )}
                        {task.test_password && (
                          <span className="flex items-center gap-1 text-sm font-mono">
                            <Key className="h-4 w-4" />
                            {task.test_password}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  {assignee && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          <span className="font-medium text-emerald-700 dark:text-emerald-400">
                            Zugewiesen an: {assignee.first_name} {assignee.last_name}
                          </span>
                        </div>
                        {(task.status === 'in_progress' || task.status === 'sms_requested') && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 text-xs"
                            onClick={() => {
                              toast({
                                title: 'Status angefordert',
                                description: `Eine Statusanfrage wurde an ${assignee.first_name} gesendet.`
                              });
                            }}
                          >
                            <MessageCircle className="h-3 w-3" />
                            Status anfragen
                          </Button>
                        )}
                      </div>
                      {assignment?.progress_notes && (
                        <div className="mt-2 p-2 bg-background/50 rounded text-sm">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                            <Activity className="h-3 w-3" />
                            Mitarbeiter-Notizen:
                          </div>
                          <p>{assignment.progress_notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {tasks.length === 0 && (
          <Card className="shadow-card">
            <CardContent className="py-8 text-center text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Keine Aufträge vorhanden.</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Auftrag zuweisen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Auftrag: <strong>{selectedTask?.title}</strong>
            </p>
            <div className="space-y-2">
              <Label>Mitarbeiter auswählen</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="Mitarbeiter wählen..." />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.user_id} value={emp.user_id}>
                      {emp.first_name} {emp.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAssignTask} className="w-full">Zuweisen</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
