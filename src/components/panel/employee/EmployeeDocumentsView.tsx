import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Document, Task } from '@/types/panel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { FileText, Upload, Trash2, Download, AlertCircle

 } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useTabContext } from '../EmployeeDashboard';

const documentTypes = [
  { value: 'documentation', label: 'Dokumentation' },
  { value: 'id_card', label: 'Personalausweis' },
  { value: 'passport', label: 'Reisepass' },
  { value: 'contract', label: 'Vertrag' },
  { value: 'certificate', label: 'Zertifikat' },
  { value: 'task_document', label: 'Auftragsdokument' },
  { value: 'letter', label: 'Brief' },
  { value: 'other', label: 'Sonstiges' }
];

export default function EmployeeDocumentsView() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('documentation');
  const [selectedTask, setSelectedTask] = useState<string>('none');
  const [uploading, setUploading] = useState(false);
  const [lockedTaskId, setLockedTaskId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const tabContext = useTabContext();

  useEffect(() => {
    if (user) {
      fetchDocuments();
      fetchTasks();
    }
  }, [user]);

  // Handle pending task from navigation
  useEffect(() => {
    if (tabContext?.pendingTaskId) {
      setSelectedTask(tabContext.pendingTaskId);
      setLockedTaskId(tabContext.pendingTaskId);
      // Clear the pending task after using it
      tabContext.setPendingTaskId(null);
    }
  }, [tabContext?.pendingTaskId]);

  const fetchDocuments = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', user.id)
      .order('uploaded_at', { ascending: false });

    if (data && !error) {
      setDocuments(data as Document[]);
    }
  };

  const fetchTasks = async () => {
    if (!user) return;

    const { data: assignments } = await supabase
      .from('task_assignments')
      .select('task_id')
      .eq('user_id', user.id);

    if (assignments && assignments.length > 0) {
      const taskIds = assignments.map(a => a.task_id);
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')
        .in('id', taskIds)
        .not('status', 'in', '("completed","cancelled")');

      if (tasksData) {
        setTasks(tasksData as Task[]);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      if (file.size > maxSize) {
        toast({ title: 'Fehler', description: 'Datei ist zu groß. Max. 10MB erlaubt.', variant: 'destructive' });
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) {
      toast({ title: 'Fehler', description: 'Bitte Datei auswählen.', variant: 'destructive' });
      return;
    }

    setUploading(true);

    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from('documents').insert({
        user_id: user.id,
        task_id: selectedTask !== 'none' ? selectedTask : null,
        file_name: selectedFile.name,
        file_path: fileName,
        file_type: selectedFile.type,
        file_size: selectedFile.size,
        document_type: documentType
      });

      if (dbError) throw dbError;

      toast({ title: 'Erfolg', description: 'Dokument wurde hochgeladen.' });
      setSelectedFile(null);
      setDocumentType('documentation');
      setSelectedTask('none');
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      fetchDocuments();
    } catch (error: any) {
      toast({ title: 'Fehler', description: error.message || 'Upload fehlgeschlagen.', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (doc: Document) => {
    try {
      await supabase.storage.from('documents').remove([doc.file_path]);
      await supabase.from('documents').delete().eq('id', doc.id);
      toast({ title: 'Erfolg', description: 'Dokument wurde gelöscht.' });
      fetchDocuments();
    } catch (error) {
      toast({ title: 'Fehler', description: 'Löschen fehlgeschlagen.', variant: 'destructive' });
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      const { data, error } = await supabase.storage.from('documents').download(doc.file_path);
      if (error) throw error;
      if (data) {
        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.file_name;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      toast({ title: 'Fehler', description: 'Download fehlgeschlagen.', variant: 'destructive' });
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    return documentTypes.find(t => t.value === type)?.label || type;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Dokumente</h2>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Dokument hochladen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Datei auswählen</Label>
              <Input
                type="file"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">
                Erlaubt: Alle gängigen Formate (PDF, Word, Excel, Bilder, etc.) • Max. 10MB
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Dokumentenart</Label>
                <Select value={documentType} onValueChange={setDocumentType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Zu Auftrag zuordnen {lockedTaskId ? '' : '(optional)'}</Label>
                {lockedTaskId ? (
                  // Show locked task as non-interactive display
                  <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground">
                    {tasks.find(t => t.id === lockedTaskId)?.title || 'Auftrag wird geladen...'}
                  </div>
                ) : (
                  // Show select when not locked
                  <Select 
                    value={selectedTask} 
                    onValueChange={setSelectedTask}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Kein Auftrag" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Kein Auftrag</SelectItem>
                      {tasks.map((task) => (
                        <SelectItem key={task.id} value={task.id}>
                          {task.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <Button onClick={handleUpload} disabled={!selectedFile || uploading} className="w-full gap-2">
              <Upload className="h-4 w-4" />
              {uploading ? 'Wird hochgeladen...' : 'Hochladen'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Meine Dokumente</CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <AlertCircle className="h-8 w-8" />
              </div>
              <p className="font-medium">Keine Dokumente vorhanden.</p>
              <p className="text-sm mt-1">Lade dein erstes Dokument hoch.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{doc.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {getDocumentTypeLabel(doc.document_type)} • {format(new Date(doc.uploaded_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleDownload(doc)} title="Herunterladen">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(doc)} title="Löschen">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
