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
import AdminChatView from './admin/AdminChatView';
import { ClipboardList, Users, MessageSquare, Calendar, BarChart3, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { InboxButton } from './InboxButton';
import { StatusSelector } from './StatusSelector';
import { TelegramToast } from './TelegramToast';
import { useAuth } from '@/hooks/useAuth';

interface NotificationData {
  id: string;
  senderName: string;
  senderAvatar?: string;
  senderInitials: string;
  message: string;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('tasks');
  const [pendingSmsCount, setPendingSmsCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [notification, setNotification] = useState<NotificationData | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchPendingSmsCount();
    fetchUnreadMessages();

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

    // Listen for new chat messages
    const chatChannel = supabase
      .channel('admin-chat-notifications')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'chat_messages'
      }, async (payload) => {
        if (user && payload.new.recipient_id === user.id && !payload.new.is_group_message && !payload.new.read_at) {
          setUnreadMessages(prev => prev + 1);
          
          // Fetch sender info for Telegram-style toast
          const { data: senderData } = await supabase
            .from('profiles')
            .select('first_name, last_name, avatar_url')
            .eq('user_id', payload.new.sender_id)
            .single();

          if (senderData) {
            const avatarUrl = senderData.avatar_url 
              ? supabase.storage.from('avatars').getPublicUrl(senderData.avatar_url).data.publicUrl
              : undefined;
              
            setNotification({
              id: payload.new.id,
              senderName: `${senderData.first_name} ${senderData.last_name}`,
              senderAvatar: avatarUrl,
              senderInitials: `${senderData.first_name?.[0] || ''}${senderData.last_name?.[0] || ''}`,
              message: payload.new.message || (payload.new.image_url ? '📷 Bild' : '')
            });
          }
        }
      })
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'chat_messages' 
      }, () => {
        fetchUnreadMessages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(smsChannel);
      supabase.removeChannel(chatChannel);
    };
  }, [user]);

  const fetchPendingSmsCount = async () => {
    const { count } = await supabase
      .from('sms_code_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');
    
    setPendingSmsCount(count || 0);
  };

  const fetchUnreadMessages = async () => {
    if (!user) return;
    
    const { count } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', user.id)
      .eq('is_group_message', false)
      .is('read_at', null);
    
    setUnreadMessages(count || 0);
  };

  const handleLogoClick = () => {
    setActiveTab('tasks');
  };

  const handleInboxClick = () => {
    setActiveTab('chat');
  };

  return (
    <PanelLayout 
      title="Admin-Panel" 
      onLogoClick={handleLogoClick}
      headerActions={
        <>
          <StatusSelector />
          <InboxButton onClick={handleInboxClick} />
        </>
      }
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
          <TabsTrigger value="chat" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all relative">
            <MessageCircle className="h-4 w-4" />
            <span className="hidden sm:inline font-medium">Chat</span>
            {unreadMessages > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs animate-pulse">
                {unreadMessages}
              </Badge>
            )}
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
        <TabsContent value="chat">
          <AdminChatView />
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
      
      {notification && (
        <TelegramToast
          senderName={notification.senderName}
          senderAvatar={notification.senderAvatar}
          senderInitials={notification.senderInitials}
          message={notification.message}
          onClose={() => setNotification(null)}
          onClick={handleInboxClick}
        />
      )}
    </PanelLayout>
  );
}
