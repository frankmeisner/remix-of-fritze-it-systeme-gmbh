import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Profile, Task, TaskAssignment, Document, TimeEntry } from '@/types/panel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, User, Mail, Clock, FileText, ClipboardList, 
  Calendar, Download, Euro, CheckCircle, AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface AdminEmployeeDetailViewProps {
  employee: Profile;
  onBack: () => void;
}

export default function AdminEmployeeDetailView({ employee, onBack }: AdminEmployeeDetailViewProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [tasks, setTasks] = useState<(Task & { assignment?: TaskAssignment })[]>([]);
  const [stats, setStats] = useState({ completed: 0, totalCompensation: 0, totalHours: 0 });

  useEffect(() => {
    fetchEmployeeData();
  }, [employee]);

  const fetchEmployeeData = async () => {
    // Fetch documents
    const { data: docs } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', employee.user_id)
      .order('uploaded_at', { ascending: false });
    
    if (docs) setDocuments(docs as Document[]);

    // Fetch time entries
    const { data: entries } = await supabase
      .from('time_entries')
      .select('*')
      .eq('user_id', employee.user_id)
      .order('timestamp', { ascending: false })
      .limit(50);
    
    if (entries) setTimeEntries(entries as TimeEntry[]);

    // Fetch task assignments
    const { data: assignments } = await supabase
      .from('task_assignments')
      .select('*')
      .eq('user_id', employee.user_id);

    if (assignments && assignments.length > 0) {
      const taskIds = assignments.map(a => a.task_id);
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')
        .in('id', taskIds)
        .order('created_at', { ascending: false });

      if (tasksData) {
        const enrichedTasks = tasksData.map(task => ({
          ...task as Task,
          assignment: assignments.find(a => a.task_id === task.id) as TaskAssignment
        }));
        setTasks(enrichedTasks);

        // Calculate stats
        const completedTasks = enrichedTasks.filter(t => t.status === 'completed');
        const totalComp = completedTasks.reduce((sum, t) => sum + (t.special_compensation || 0), 0);
        
        setStats({
          completed: completedTasks.length,
          totalCompensation: totalComp,
          totalHours: calculateTotalHours(entries || [])
        });
      }
    }
  };

  const calculateTotalHours = (entries: TimeEntry[]) => {
    let total = 0;
    let checkIn: Date | null = null;
    let pauseStart: Date | null = null;
    let pauseDuration = 0;

    const sortedEntries = [...entries].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    for (const entry of sortedEntries) {
      const timestamp = new Date(entry.timestamp);
      
      if (entry.entry_type === 'check_in') {
        checkIn = timestamp;
        pauseDuration = 0;
      } else if (entry.entry_type === 'pause_start' && checkIn) {
        pauseStart = timestamp;
      } else if (entry.entry_type === 'pause_end' && pauseStart) {
        pauseDuration += (timestamp.getTime() - pauseStart.getTime()) / (1000 * 60 * 60);
        pauseStart = null;
      } else if (entry.entry_type === 'check_out' && checkIn) {
        const worked = (timestamp.getTime() - checkIn.getTime()) / (1000 * 60 * 60) - pauseDuration;
        total += Math.max(0, worked);
        checkIn = null;
        pauseDuration = 0;
      }
    }
    return total;
  };

  const handleDownload = async (doc: Document) => {
    const { data } = await supabase.storage.from('documents').download(doc.file_path);
    if (data) {
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const entryTypeLabels: Record<string, string> = {
    check_in: 'Check-In',
    check_out: 'Check-Out',
    pause_start: 'Pause Start',
    pause_end: 'Pause Ende'
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Zurück zur Übersicht
      </Button>

      {/* Employee Header */}
      <Card className="shadow-lg">
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24">
              {employee.avatar_url ? (
                <AvatarImage src={employee.avatar_url} alt={`${employee.first_name} ${employee.last_name}`} />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                {employee.first_name?.[0]}{employee.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{employee.first_name} {employee.last_name}</h2>
              <p className="text-muted-foreground flex items-center gap-2 mt-1">
                <Mail className="h-4 w-4" />
                {employee.email}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Registriert: {format(new Date(employee.created_at), 'dd.MM.yyyy', { locale: de })}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-6 text-center">
              <div className="p-4 bg-emerald-500/10 rounded-lg">
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.completed}</p>
                <p className="text-xs text-muted-foreground">Abgeschlossen</p>
              </div>
              <div className="p-4 bg-blue-500/10 rounded-lg">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalHours.toFixed(1)}h</p>
                <p className="text-xs text-muted-foreground">Arbeitsstunden</p>
              </div>
              <div className="p-4 bg-amber-500/10 rounded-lg">
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.totalCompensation.toFixed(2)}€</p>
                <p className="text-xs text-muted-foreground">Vergütung</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tasks" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            Aufträge ({tasks.length})
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-2">
            <FileText className="h-4 w-4" />
            Dokumente ({documents.length})
          </TabsTrigger>
          <TabsTrigger value="time" className="gap-2">
            <Clock className="h-4 w-4" />
            Zeiterfassung
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks">
          <div className="grid gap-4">
            {tasks.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Keine Aufträge vorhanden.</p>
                </CardContent>
              </Card>
            ) : (
              tasks.map(task => (
                <Card key={task.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold">{task.title}</h4>
                        <p className="text-sm text-muted-foreground">{task.customer_name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={
                          task.status === 'completed' ? 'bg-green-500/20 text-green-700 dark:text-green-400' :
                          task.status === 'in_progress' ? 'bg-blue-500/20 text-blue-700 dark:text-blue-400' :
                          'bg-gray-500/20 text-gray-700 dark:text-gray-400'
                        }>
                          {task.status === 'completed' ? 'Abgeschlossen' : 
                           task.status === 'in_progress' ? 'In Bearbeitung' : 
                           task.status === 'assigned' ? 'Zugewiesen' : task.status}
                        </Badge>
                        {task.special_compensation && (
                          <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                            <Euro className="h-3 w-3 mr-1" />
                            {task.special_compensation.toFixed(2)}€
                          </Badge>
                        )}
                      </div>
                    </div>
                    {task.assignment?.progress_notes && (
                      <div className="mt-3 p-3 bg-muted/50 rounded-lg text-sm">
                        <p className="text-xs text-muted-foreground mb-1">Mitarbeiter-Notizen:</p>
                        <p>{task.assignment.progress_notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="documents">
          <div className="grid gap-4">
            {documents.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Keine Dokumente hochgeladen.</p>
                </CardContent>
              </Card>
            ) : (
              documents.map(doc => (
                <Card key={doc.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{doc.file_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(doc.uploaded_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                            {doc.file_size && ` • ${(doc.file_size / 1024).toFixed(1)} KB`}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleDownload(doc)}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="time">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Letzte Zeiteinträge</CardTitle>
            </CardHeader>
            <CardContent>
              {timeEntries.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">Keine Zeiteinträge vorhanden.</p>
              ) : (
                <div className="space-y-2">
                  {timeEntries.slice(0, 20).map(entry => (
                    <div key={entry.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={
                          entry.entry_type === 'check_in' ? 'border-green-500 text-green-700 dark:text-green-400' :
                          entry.entry_type === 'check_out' ? 'border-red-500 text-red-700 dark:text-red-400' :
                          'border-yellow-500 text-yellow-700 dark:text-yellow-400'
                        }>
                          {entryTypeLabels[entry.entry_type]}
                        </Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(entry.timestamp), 'dd.MM.yyyy HH:mm', { locale: de })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}