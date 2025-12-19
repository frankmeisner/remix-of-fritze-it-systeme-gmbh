import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTabContext } from '@/components/panel/EmployeeDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Bell, CheckCircle2, MessageSquare, ClipboardList, Trash2, CheckCheck, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  related_task_id: string | null;
  read_at: string | null;
  created_at: string;
}

const typeConfig: Record<string, { icon: typeof Bell; color: string; label: string }> = {
  status_request: { icon: MessageSquare, color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10', label: 'Statusanfrage' },
  task_completed: { icon: CheckCircle2, color: 'text-green-600 dark:text-green-400 bg-green-500/10', label: 'Abgeschlossen' },
  task_assigned: { icon: ClipboardList, color: 'text-blue-600 dark:text-blue-400 bg-blue-500/10', label: 'Zugewiesen' },
  info: { icon: Bell, color: 'text-primary bg-primary/10', label: 'Info' },
};

export default function EmployeeNotificationsView() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const tabContext = useTabContext();

  useEffect(() => {
    if (user) {
      fetchNotifications();

      const channel = supabase
        .channel(`employee-notifications:${user.id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, fetchNotifications)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, fetchNotifications)
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, fetchNotifications)
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .is('read_at', null)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setNotifications(data);
    }
    setLoading(false);
  };

  const handleMarkAsRead = async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      // Remove from list immediately (we only show unread)
      setNotifications(prev => prev.filter(n => n.id !== id));
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadIds = notifications.map(n => n.id);
    if (unreadIds.length === 0) return;

    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .in('id', unreadIds);

    if (!error) {
      setNotifications([]);
    }
  };

  const handleGoToTask = (taskId: string | null) => {
    if (taskId && tabContext) {
      tabContext.setActiveTab('tasks');
    }
  };

  const unreadCount = notifications.filter(n => !n.read_at).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Bell className="h-8 w-8 text-primary" />
            Benachrichtigungen
          </h2>
          <p className="text-muted-foreground mt-1">
            {unreadCount > 0 ? `${unreadCount} ungelesene Benachrichtigung${unreadCount > 1 ? 'en' : ''}` : 'Alle Benachrichtigungen gelesen'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={handleMarkAllAsRead} className="gap-2">
            <CheckCheck className="h-4 w-4" />
            Alle als gelesen markieren
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card className="shadow-lg border-dashed">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Bell className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Keine Benachrichtigungen</h3>
            <p className="text-muted-foreground">
              Du hast noch keine Benachrichtigungen erhalten.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const config = typeConfig[notification.type] || typeConfig.info;
            const IconComponent = config.icon;
            const isUnread = !notification.read_at;

            return (
              <Card 
                key={notification.id} 
                className={`transition-all hover:shadow-md ${isUnread ? 'border-l-4 border-l-primary bg-primary/5' : 'opacity-75'}`}
              >
                <CardContent className="py-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-2.5 rounded-full shrink-0 ${config.color}`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className={`font-semibold ${isUnread ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {notification.title}
                            </h4>
                            <Badge variant="secondary" className="text-xs">
                              {config.label}
                            </Badge>
                            {isUnread && (
                              <Badge className="bg-primary text-primary-foreground text-xs">
                                Neu
                              </Badge>
                            )}
                          </div>
                          <p className={`text-sm mt-1 whitespace-pre-wrap ${isUnread ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {format(new Date(notification.created_at), "dd. MMMM yyyy 'um' HH:mm 'Uhr'", { locale: de })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {notification.related_task_id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleGoToTask(notification.related_task_id)}
                              className="text-xs"
                            >
                              <ClipboardList className="h-4 w-4 mr-1" />
                              Zum Auftrag
                            </Button>
                          )}
                          {isUnread && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="text-xs text-muted-foreground hover:text-foreground"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
