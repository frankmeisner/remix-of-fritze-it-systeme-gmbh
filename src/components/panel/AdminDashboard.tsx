import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import PanelLayout from './PanelLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import AdminTasksView from './admin/AdminTasksView';
import AdminUsersView from './admin/AdminUsersView';
import AdminSmsView from './admin/AdminSmsView';
import AdminVacationView from './admin/AdminVacationView';
import AdminStatsView from './admin/AdminStatsView';
import AdminActivityView from './admin/AdminActivityView';
import { ClipboardList, Users, MessageSquare, Calendar, BarChart3, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export default function AdminDashboard() {
  const [activeTab, setActiveTabState] = useState(() => {
    return sessionStorage.getItem('adminActiveTab') || 'tasks';
  });
  const [pendingSmsCount, setPendingSmsCount] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth();

  const setActiveTab = (tab: string) => {
    sessionStorage.setItem('adminActiveTab', tab);
    setActiveTabState(tab);
  };

  // Save scroll position continuously and restore on mount/visibility change
  useEffect(() => {
    // Restore scroll position on mount with smooth behavior
    const savedPosition = sessionStorage.getItem('adminScrollPosition');
    if (savedPosition) {
      setTimeout(() => window.scrollTo({ top: parseInt(savedPosition), behavior: 'smooth' }), 100);
    }

    // Save scroll position on scroll
    const handleScroll = () => {
      sessionStorage.setItem('adminScrollPosition', window.scrollY.toString());
    };

    // Restore scroll position when tab becomes visible again
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const pos = sessionStorage.getItem('adminScrollPosition');
        if (pos) {
          setTimeout(() => window.scrollTo({ top: parseInt(pos), behavior: 'smooth' }), 100);
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    fetchPendingSmsCount();

    // Listen for new SMS requests
    const smsChannel = supabase
      .channel('admin-sms-notifications')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'sms_code_requests' 
      }, (payload) => {
        if (payload.new?.status === 'pending') {
          setPendingSmsCount(prev => prev + 1);
          toast({
            title: 'Neue SMS-Code Anfrage',
            description: 'Ein Mitarbeiter hat einen SMS-Code angefordert.',
            variant: 'default',
          });
        }
      })
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'sms_code_requests' 
      }, () => {
        fetchPendingSmsCount();
      })
      .subscribe();

    // Listen for task completion notifications
    const notificationsChannel = supabase
      .channel('admin-task-notifications')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications'
      }, (payload) => {
        if (user && payload.new.user_id === user.id && payload.new.type === 'task_completed') {
          toast({
            title: payload.new.title,
            description: payload.new.message,
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(smsChannel);
      supabase.removeChannel(notificationsChannel);
    };
  }, [user]);

  const fetchPendingSmsCount = async () => {
    const { count } = await supabase
      .from('sms_code_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');
    
    setPendingSmsCount(count || 0);
  };

  const handleLogoClick = () => {
    setActiveTab('tasks');
  };

  return (
    <PanelLayout 
      title="Admin-Panel" 
      onLogoClick={handleLogoClick}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="glass-panel grid w-full grid-cols-6 lg:w-auto lg:inline-flex p-1.5 gap-1">
          <TabsTrigger value="tasks" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all">
            <ClipboardList className="h-4 w-4" />
            <span className="hidden sm:inline font-medium">Aufträge</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline font-medium">Mitarbeiter</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline font-medium">Aktivität</span>
          </TabsTrigger>
          <TabsTrigger value="sms" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all relative">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline font-medium">SMS-Codes</span>
            {pendingSmsCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs animate-pulse">
                {pendingSmsCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="vacation" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline font-medium">Anträge</span>
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline font-medium">Statistik</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks">
          <AdminTasksView />
        </TabsContent>
        <TabsContent value="users">
          <AdminUsersView />
        </TabsContent>
        <TabsContent value="activity">
          <AdminActivityView />
        </TabsContent>
        <TabsContent value="sms">
          <AdminSmsView />
        </TabsContent>
        <TabsContent value="vacation">
          <AdminVacationView />
        </TabsContent>
        <TabsContent value="stats">
          <AdminStatsView />
        </TabsContent>
      </Tabs>
    </PanelLayout>
  );
}
