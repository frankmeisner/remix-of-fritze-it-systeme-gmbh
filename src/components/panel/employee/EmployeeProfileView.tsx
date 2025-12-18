import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Camera, User, Mail, Euro, CheckCircle, Clock, FileText } from 'lucide-react';

interface EmployeeStats {
  completedTasks: number;
  totalCompensation: number;
  totalWorkHours: number;
}

export default function EmployeeProfileView() {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState<EmployeeStats>({ completedTasks: 0, totalCompensation: 0, totalWorkHours: 0 });
  const [taskHistory, setTaskHistory] = useState<any[]>([]);
  const { toast } = useToast();
  const { user, profile } = useAuth();

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchStats();
      fetchTaskHistory();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('user_id', user.id)
      .single();
    
    if (data?.avatar_url) {
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(data.avatar_url);
      setAvatarUrl(urlData.publicUrl);
    }
  };

  const fetchStats = async () => {
    if (!user) return;

    // Get completed tasks count and compensation
    const { data: assignments } = await supabase
      .from('task_assignments')
      .select('task_id, status')
      .eq('user_id', user.id)
      .eq('status', 'completed');

    if (assignments && assignments.length > 0) {
      const taskIds = assignments.map(a => a.task_id);
      const { data: tasks } = await supabase
        .from('tasks')
        .select('special_compensation')
        .in('id', taskIds);

      const totalComp = tasks?.reduce((sum, t) => sum + (t.special_compensation || 0), 0) || 0;
      
      setStats(prev => ({
        ...prev,
        completedTasks: assignments.length,
        totalCompensation: totalComp
      }));
    }

    // Calculate work hours from time entries
    const { data: entries } = await supabase
      .from('time_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: true });

    if (entries) {
      let totalMs = 0;
      let checkInTime: Date | null = null;
      let pauseStartTime: Date | null = null;
      let pauseDuration = 0;

      for (const entry of entries) {
        const timestamp = new Date(entry.timestamp);
        switch (entry.entry_type) {
          case 'check_in':
            checkInTime = timestamp;
            pauseDuration = 0;
            break;
          case 'check_out':
            if (checkInTime) {
              totalMs += timestamp.getTime() - checkInTime.getTime() - pauseDuration;
              checkInTime = null;
              pauseDuration = 0;
            }
            break;
          case 'pause_start':
            pauseStartTime = timestamp;
            break;
          case 'pause_end':
            if (pauseStartTime) {
              pauseDuration += timestamp.getTime() - pauseStartTime.getTime();
              pauseStartTime = null;
            }
            break;
        }
      }

      setStats(prev => ({
        ...prev,
        totalWorkHours: Math.round(totalMs / (1000 * 60 * 60) * 10) / 10
      }));
    }
  };

  const fetchTaskHistory = async () => {
    if (!user) return;

    const { data: assignments } = await supabase
      .from('task_assignments')
      .select('task_id, status, accepted_at')
      .eq('user_id', user.id)
      .eq('status', 'completed');

    if (assignments && assignments.length > 0) {
      const taskIds = assignments.map(a => a.task_id);
      const { data: tasks } = await supabase
        .from('tasks')
        .select('id, title, customer_name, special_compensation, updated_at')
        .in('id', taskIds)
        .order('updated_at', { ascending: false });

      if (tasks) {
        setTaskHistory(tasks);
      }
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;

    const file = e.target.files[0];
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Fehler', description: 'Bild max. 2MB erlaubt.', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: filePath })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      setAvatarUrl(urlData.publicUrl + '?t=' + Date.now());
      
      toast({ title: 'Erfolg', description: 'Profilbild wurde aktualisiert.' });
    } catch (error: any) {
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Mein Profil</h2>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Profilinformationen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={avatarUrl || ''} />
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                    {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <label className="absolute -bottom-1 -right-1 p-2 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90 transition-colors">
                  <Camera className="h-4 w-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              </div>
              {uploading && <p className="text-sm text-muted-foreground">Wird hochgeladen...</p>}
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{profile?.first_name} {profile?.last_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">E-Mail</p>
                  <p className="font-medium">{profile?.email}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Meine Statistiken</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="flex items-center gap-4 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                <div className="p-3 bg-green-500/20 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Abgeschlossene Aufträge</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.completedTasks}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                <div className="p-3 bg-emerald-500/20 rounded-full">
                  <Euro className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Gesammelte Vergütung</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.totalCompensation.toFixed(2)} €</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <div className="p-3 bg-blue-500/20 rounded-full">
                  <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Arbeitsstunden gesamt</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalWorkHours}h</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Auftragshistorie
          </CardTitle>
        </CardHeader>
        <CardContent>
          {taskHistory.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Noch keine abgeschlossenen Aufträge.</p>
          ) : (
            <div className="space-y-3">
              {taskHistory.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                  <div>
                    <p className="font-medium">{task.title}</p>
                    <p className="text-sm text-muted-foreground">Kunde: {task.customer_name}</p>
                  </div>
                  {task.special_compensation && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      +{task.special_compensation.toFixed(2)} €
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
