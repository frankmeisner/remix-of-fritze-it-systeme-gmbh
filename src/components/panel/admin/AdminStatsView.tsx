import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Profile, TimeEntry, TaskAssignment, Task, TaskStatus } from '@/types/panel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Users, ClipboardList, Clock, TrendingUp, Activity } from 'lucide-react';

interface EmployeeStats {
  profile: Profile;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  todayHours: number;
}

interface TaskWithAssignee extends Task {
  assignee?: Profile;
}

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

export default function AdminStatsView() {
  const [employeeStats, setEmployeeStats] = useState<EmployeeStats[]>([]);
  const [inProgressTasks, setInProgressTasks] = useState<TaskWithAssignee[]>([]);
  const [totalStats, setTotalStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    activeTasks: 0,
    totalEmployees: 0
  });

  useEffect(() => {
    fetchStats();

    // Realtime subscription
    const channel = supabase
      .channel('stats-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_assignments' }, fetchStats)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchStats = async () => {
    // Fetch all tasks
    const { data: tasks } = await supabase.from('tasks').select('*');
    
    // Fetch employee profiles
    const { data: roles } = await supabase.from('user_roles').select('user_id').eq('role', 'employee');
    
    // Fetch assignments
    const { data: assignments } = await supabase.from('task_assignments').select('*');
    
    // Fetch all profiles for assignee lookup
    const { data: allProfiles } = await supabase.from('profiles').select('*');
    
    if (roles && roles.length > 0) {
      const userIds = roles.map(r => r.user_id);
      const profiles = allProfiles?.filter(p => userIds.includes(p.user_id)) || [];
      
      // Fetch today's time entries
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data: timeEntries } = await supabase
        .from('time_entries')
        .select('*')
        .gte('timestamp', today.toISOString());

      if (profiles) {
        const stats: EmployeeStats[] = profiles.map(profile => {
          const userAssignments = assignments?.filter(a => a.user_id === profile.user_id) || [];
          const userTaskIds = userAssignments.map(a => a.task_id);
          const userTasks = tasks?.filter(t => userTaskIds.includes(t.id)) || [];
          
          // Calculate today's hours
          const userTimeEntries = timeEntries?.filter(e => e.user_id === profile.user_id) || [];
          let todayHours = 0;
          
          // Simple calculation: find check-ins and check-outs
          const checkIns = userTimeEntries.filter(e => e.entry_type === 'check_in');
          const checkOuts = userTimeEntries.filter(e => e.entry_type === 'check_out');
          
          checkIns.forEach((checkIn, idx) => {
            const checkOut = checkOuts[idx];
            if (checkOut) {
              const diff = new Date(checkOut.timestamp).getTime() - new Date(checkIn.timestamp).getTime();
              todayHours += diff / (1000 * 60 * 60);
            }
          });

          return {
            profile: profile as Profile,
            totalTasks: userTasks.length,
            completedTasks: userTasks.filter(t => t.status === 'completed').length,
            inProgressTasks: userTasks.filter(t => t.status === 'in_progress' || t.status === 'sms_requested').length,
            todayHours: Math.round(todayHours * 10) / 10
          };
        });

        setEmployeeStats(stats);
      }
    }

    // Set in-progress tasks with assignees
    if (tasks && assignments && allProfiles) {
      const activeTasksWithAssignee: TaskWithAssignee[] = tasks
        .filter(t => t.status === 'in_progress' || t.status === 'sms_requested')
        .map(task => {
          const assignment = assignments.find(a => a.task_id === task.id);
          const assignee = assignment 
            ? allProfiles.find(p => p.user_id === assignment.user_id) as Profile | undefined
            : undefined;
          return { ...task as Task, assignee };
        });
      setInProgressTasks(activeTasksWithAssignee);
    }

    // Set total stats
    if (tasks) {
      setTotalStats({
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.status === 'completed').length,
        activeTasks: tasks.filter(t => ['assigned', 'in_progress', 'sms_requested'].includes(t.status)).length,
        totalEmployees: roles?.length || 0
      });
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Statistiken & Übersicht</h2>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Gesamt Aufträge</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ClipboardList className="h-8 w-8 text-primary" />
              <span className="text-3xl font-bold">{totalStats.totalTasks}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Abgeschlossen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <span className="text-3xl font-bold">{totalStats.completedTasks}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aktive Aufträge</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-8 w-8 text-blue-500" />
              <span className="text-3xl font-bold">{totalStats.activeTasks}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Mitarbeiter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-8 w-8 text-purple-500" />
              <span className="text-3xl font-bold">{totalStats.totalEmployees}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* In Progress Tasks Section */}
      {inProgressTasks.length > 0 && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              Aufträge in Bearbeitung
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Auftrag</th>
                    <th className="text-left py-3 px-4 font-medium">Kunde</th>
                    <th className="text-center py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Bearbeiter</th>
                  </tr>
                </thead>
                <tbody>
                  {inProgressTasks.map((task) => (
                    <tr key={task.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium">{task.title}</td>
                      <td className="py-3 px-4 text-muted-foreground">{task.customer_name}</td>
                      <td className="text-center py-3 px-4">
                        <Badge className={statusColors[task.status]}>
                          {statusLabels[task.status]}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        {task.assignee ? (
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                              <span className="text-xs font-medium text-primary">
                                {task.assignee.first_name[0]}{task.assignee.last_name[0]}
                              </span>
                            </div>
                            <span className="text-sm">{task.assignee.first_name} {task.assignee.last_name}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Nicht zugewiesen</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Mitarbeiter-Übersicht</CardTitle>
        </CardHeader>
        <CardContent>
          {employeeStats.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Keine Mitarbeiter vorhanden.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Mitarbeiter</th>
                    <th className="text-center py-3 px-4 font-medium">Aufgaben</th>
                    <th className="text-center py-3 px-4 font-medium">In Bearbeitung</th>
                    <th className="text-center py-3 px-4 font-medium">Abgeschlossen</th>
                    <th className="text-center py-3 px-4 font-medium">Heute (Std.)</th>
                  </tr>
                </thead>
                <tbody>
                  {employeeStats.map((stat) => (
                    <tr key={stat.profile.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {stat.profile.first_name[0]}{stat.profile.last_name[0]}
                            </span>
                          </div>
                          <span>{stat.profile.first_name} {stat.profile.last_name}</span>
                        </div>
                      </td>
                      <td className="text-center py-3 px-4">{stat.totalTasks}</td>
                      <td className="text-center py-3 px-4">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/20 text-blue-700 dark:text-blue-400">
                          {stat.inProgressTasks}
                        </span>
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-500/20 text-green-700 dark:text-green-400">
                          {stat.completedTasks}
                        </span>
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className="flex items-center justify-center gap-1">
                          <Clock className="h-4 w-4" />
                          {stat.todayHours}h
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
