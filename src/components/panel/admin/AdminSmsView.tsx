import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SmsCodeRequest, Task, Profile } from '@/types/panel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { MessageSquare, Send, Clock, CheckCircle, User } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function AdminSmsView() {
  const [requests, setRequests] = useState<(SmsCodeRequest & { task?: Task; profile?: Profile })[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<SmsCodeRequest | null>(null);
  const [smsCode, setSmsCode] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchRequests();

    const channel = supabase
      .channel('sms-requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sms_code_requests' }, () => {
        fetchRequests();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRequests = async () => {
    const { data } = await supabase
      .from('sms_code_requests')
      .select('*')
      .order('requested_at', { ascending: false });

    if (data) {
      // Fetch related tasks and profiles
      const taskIds = [...new Set(data.map(r => r.task_id))];
      const userIds = [...new Set(data.map(r => r.user_id))];

      const [tasksRes, profilesRes] = await Promise.all([
        supabase.from('tasks').select('*').in('id', taskIds),
        supabase.from('profiles').select('*').in('user_id', userIds)
      ]);

      const enrichedData = data.map(request => ({
        ...request,
        task: tasksRes.data?.find(t => t.id === request.task_id) as Task | undefined,
        profile: profilesRes.data?.find(p => p.user_id === request.user_id) as Profile | undefined
      }));

      setRequests(enrichedData);
    }
  };

  const handleForwardCode = async () => {
    if (!selectedRequest || !smsCode.trim()) {
      toast({ title: 'Fehler', description: 'Bitte SMS-Code eingeben.', variant: 'destructive' });
      return;
    }

    const { error } = await supabase
      .from('sms_code_requests')
      .update({
        sms_code: smsCode,
        forwarded_at: new Date().toISOString(),
        forwarded_by: user?.id,
        status: 'forwarded'
      })
      .eq('id', selectedRequest.id);

    if (error) {
      toast({ title: 'Fehler', description: 'Code konnte nicht weitergeleitet werden.', variant: 'destructive' });
    } else {
      toast({ title: 'Erfolg', description: 'SMS-Code wurde weitergeleitet.' });
      setIsDialogOpen(false);
      setSelectedRequest(null);
      setSmsCode('');
      fetchRequests();
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending' || r.status === 'resend_requested');
  const forwardedRequests = requests.filter(r => r.status === 'forwarded');

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">SMS-Code Anfragen</h2>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Clock className="h-5 w-5 text-orange-500" />
          Ausstehende Anfragen ({pendingRequests.length})
        </h3>
        
        {pendingRequests.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="py-8 text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Keine ausstehenden SMS-Anfragen.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {pendingRequests.map((request) => (
              <Card key={request.id} className="shadow-card border-l-4 border-l-orange-500">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{request.task?.title || 'Unbekannter Auftrag'}</CardTitle>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <User className="h-4 w-4" />
                        {request.profile?.first_name} {request.profile?.last_name}
                      </p>
                    </div>
                    <Badge className="bg-orange-500/20 text-orange-700 dark:text-orange-400">
                      Ausstehend
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Angefordert: {format(new Date(request.requested_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                    </span>
                    <Button
                      onClick={() => {
                        setSelectedRequest(request);
                        setIsDialogOpen(true);
                      }}
                      className="gap-2"
                    >
                      <Send className="h-4 w-4" />
                      Code weiterleiten
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          Weitergeleitet ({forwardedRequests.length})
        </h3>
        
        <div className="grid gap-4">
          {forwardedRequests.map((request) => (
            <Card key={request.id} className="shadow-card opacity-75">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{request.task?.title || 'Unbekannter Auftrag'}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {request.profile?.first_name} {request.profile?.last_name}
                    </p>
                  </div>
                  <Badge className="bg-green-500/20 text-green-700 dark:text-green-400">
                    Weitergeleitet
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Weitergeleitet am: {request.forwarded_at && format(new Date(request.forwarded_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>SMS-Code weiterleiten</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Auftrag: <strong>{selectedRequest?.task?.title}</strong>
            </p>
            <p className="text-sm text-muted-foreground">
              Mitarbeiter: <strong>{selectedRequest?.profile?.first_name} {selectedRequest?.profile?.last_name}</strong>
            </p>
            <div className="space-y-2">
              <Label>SMS-Code eingeben</Label>
              <Input
                value={smsCode}
                onChange={(e) => setSmsCode(e.target.value)}
                placeholder="123456"
                className="text-center text-2xl tracking-widest"
              />
            </div>
            <Button onClick={handleForwardCode} className="w-full gap-2">
              <Send className="h-4 w-4" />
              Code weiterleiten
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
