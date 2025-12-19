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
import { Plus, Calendar, User, Phone, Euro, AlertCircle, Mail, Key, Activity, MessageCircle, Radio, CheckCircle, Clock, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { taskCreationSchema, validateWithSchema } from '@/lib/validation';

const priorityColors: Record<TaskPriority, string> = {
  low: 'bg-slate-500/20 text-slate-700 dark:text-slate-300 border border-slate-500/30 !font-bold',
  medium: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border border-yellow-500/30 !font-bold',
  high: 'bg-red-100 text-red-800 dark:bg-red-600/30 dark:text-red-300 border border-red-400 dark:border-red-500/50 !font-bold animate-priority-pulse',
  urgent: 'bg-red-200 text-red-900 dark:bg-red-700/40 dark:text-red-200 border border-red-500 dark:border-red-600/60 !font-bold animate-priority-pulse'
};

const statusColors: Record<TaskStatus, string> = {
  pending: 'bg-muted text-muted-foreground',
  assigned: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400',
  in_progress: 'bg-blue-500/20 text-blue-700 dark:text-blue-400',
  sms_requested: 'bg-purple-500/20 text-purple-700 dark:text-purple-400',
  completed: 'bg-green-500/20 text-green-700 dark:text-green-400',
  cancelled: 'bg-destructive/20 text-destructive'
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
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in_progress' | 'completed'>('all');
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
    // Use zod schema for comprehensive validation
    const validation = validateWithSchema(taskCreationSchema, {
      title: newTask.title.trim(),
      description: newTask.description?.trim() || null,
      customer_name: newTask.customer_name.trim(),
      customer_phone: newTask.customer_phone?.trim() || null,
      test_email: newTask.test_email?.trim() || null,
      test_password: newTask.test_password || null,
      deadline: newTask.deadline || null,
      priority: newTask.priority,
      special_compensation: newTask.special_compensation ? parseFloat(newTask.special_compensation) : null,
      notes: null
    });

    if (!validation.success) {
      toast({ title: 'Fehler', description: (validation as { success: false; error: string }).error, variant: 'destructive' });
      return;
    }

    const { error } = await supabase.from('tasks').insert({
      title: validation.data.title,
      description: validation.data.description,
      customer_name: validation.data.customer_name,
      customer_phone: validation.data.customer_phone,
      deadline: validation.data.deadline,
      priority: validation.data.priority,
      special_compensation: validation.data.special_compensation,
      test_email: validation.data.test_email,
      test_password: validation.data.test_password,
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

  const handleDeleteTask = async (taskId: string) => {
    // Use the secure server-side function
    const { error } = await supabase.rpc('delete_task', { _task_id: taskId });
    
    if (error) {
      toast({ title: 'Fehler', description: 'Auftrag konnte nicht gelöscht werden.', variant: 'destructive' });
    } else {
      toast({ title: 'Erfolg', description: 'Auftrag wurde gelöscht.' });
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

  const getFilteredTasks = () => {
    switch (statusFilter) {
      case 'open':
        return tasks.filter(t => t.status === 'pending' || t.status === 'assigned');
      case 'in_progress':
        return tasks.filter(t => t.status === 'in_progress' || t.status === 'sms_requested');
      case 'completed':
        return tasks.filter(t => t.status === 'completed' || t.status === 'cancelled');
      default:
        return tasks;
    }
  };

  const openCount = tasks.filter(t => t.status === 'pending' || t.status === 'assigned').length;
  const inProgressCount = tasks.filter(t => t.status === 'in_progress' || t.status === 'sms_requested').length;
  const completedCount = tasks.filter(t => t.status === 'completed' || t.status === 'cancelled').length;
  const filteredTasks = getFilteredTasks();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">Aufträge verwalten</h2>
          <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/30">
            <Radio className="h-3 w-3 text-emerald-500 animate-pulse" />
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Live</span>
          </div>
        </div>
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

      {/* Status Filter Tabs */}
      <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-auto p-1">
          <TabsTrigger value="all" className="gap-2 py-2">
            Alle
            <Badge variant="secondary" className="ml-1">{tasks.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="open" className="gap-2 py-2">
            <Clock className="h-4 w-4" />
            Offen
            <Badge variant="secondary" className="ml-1 bg-muted">{openCount}</Badge>
          </TabsTrigger>
          <TabsTrigger value="in_progress" className="gap-2 py-2">
            <Activity className="h-4 w-4" />
            In Bearbeitung
            <Badge variant="secondary" className="ml-1 bg-blue-500/20 text-blue-700 dark:text-blue-400">{inProgressCount}</Badge>
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-2 py-2">
            <CheckCircle className="h-4 w-4" />
            Abgeschlossen
            <Badge variant="secondary" className="ml-1 bg-green-500/20 text-green-700 dark:text-green-400">{completedCount}</Badge>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-4">
        {filteredTasks.map((task) => {
          const assignee = getTaskAssignee(task.id);
          const assignment = getTaskAssignment(task.id);
          const isHighPriority = task.priority === 'high' || task.priority === 'urgent';
          return (
            <Card key={task.id} className={`glass-card overflow-hidden transition-all hover:shadow-glow ${isHighPriority ? 'neon-border' : ''}`}>
              <div className={`h-1.5 ${
                task.priority === 'urgent' ? 'bg-gradient-to-r from-red-600 via-red-500 to-red-600 animate-pulse' :
                task.priority === 'high' ? 'bg-gradient-to-r from-red-500 to-red-600' :
                task.priority === 'medium' ? 'bg-gradient-to-r from-yellow-500 to-amber-500' : 'bg-muted'
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
                  <div className="flex items-center gap-2">
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
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Auftrag löschen?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Dieser Vorgang kann nicht rückgängig gemacht werden. Der Auftrag "{task.title}" und alle zugehörigen Daten werden dauerhaft gelöscht.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteTask(task.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Löschen
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
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
                    {task.deadline && !isNaN(new Date(task.deadline).getTime()) && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 rounded-lg text-sm">
                        <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Abgabefrist</p>
                          <span className="font-semibold text-amber-700 dark:text-amber-400">
                            {format(new Date(task.deadline), 'dd.MM.yyyy HH:mm', { locale: de })}
                          </span>
                        </div>
                      </div>
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
        {filteredTasks.length === 0 && (
          <Card className="shadow-card">
            <CardContent className="py-8 text-center text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>
                {statusFilter === 'all' 
                  ? 'Keine Aufträge vorhanden.' 
                  : statusFilter === 'open' 
                    ? 'Keine offenen Aufträge.' 
                    : statusFilter === 'in_progress' 
                      ? 'Keine Aufträge in Bearbeitung.' 
                      : 'Keine abgeschlossenen Aufträge.'}
              </p>
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
