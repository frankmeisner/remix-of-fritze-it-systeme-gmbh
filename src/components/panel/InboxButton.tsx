import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Inbox } from 'lucide-react';
import { TelegramToast } from './TelegramToast';

interface SenderInfo {
  first_name: string;
  last_name: string;
  avatar_url: string | null;
}

interface NotificationData {
  id: string;
  senderName: string;
  senderAvatar?: string;
  senderInitials: string;
  message: string;
}

interface InboxButtonProps {
  onClick: () => void;
}

export function InboxButton({ onClick }: InboxButtonProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notification, setNotification] = useState<NotificationData | null>(null);
  const { user } = useAuth();

  const getAvatarUrl = useCallback((avatarPath: string | null) => {
    if (!avatarPath) return undefined;
    const { data } = supabase.storage.from('avatars').getPublicUrl(avatarPath);
    return data.publicUrl;
  }, []);

  useEffect(() => {
    if (user) {
      fetchUnreadCount();

      const channel = supabase
        .channel('inbox-notifications')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'chat_messages',
          filter: `recipient_id=eq.${user.id}`
        }, async (payload) => {
          if (!payload.new.is_group_message && !payload.new.read_at) {
            setUnreadCount(prev => prev + 1);
            
            // Fetch sender info for Telegram-style toast
            const { data: senderData } = await supabase
              .from('profiles')
              .select('first_name, last_name, avatar_url')
              .eq('user_id', payload.new.sender_id)
              .single();

            if (senderData) {
              const sender = senderData as SenderInfo;
              setNotification({
                id: payload.new.id,
                senderName: `${sender.first_name} ${sender.last_name}`,
                senderAvatar: getAvatarUrl(sender.avatar_url),
                senderInitials: `${sender.first_name?.[0] || ''}${sender.last_name?.[0] || ''}`,
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
          fetchUnreadCount();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, getAvatarUrl]);

  const fetchUnreadCount = async () => {
    if (!user) return;
    
    const { count, error } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', user.id)
      .eq('is_group_message', false)
      .is('read_at', null);
    
    if (!error && count !== null) {
      setUnreadCount(count);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    
    await supabase
      .from('chat_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('recipient_id', user.id)
      .is('read_at', null);
    
    setUnreadCount(0);
  };

  const handleClick = () => {
    markAllAsRead();
    onClick();
  };

  return (
    <>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={handleClick}
        className="relative"
        title="Nachrichten"
      >
        <Inbox className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            className="absolute -top-1 -right-1 h-5 min-w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs border-2 border-background"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>
      
      {notification && (
        <TelegramToast
          senderName={notification.senderName}
          senderAvatar={notification.senderAvatar}
          senderInitials={notification.senderInitials}
          message={notification.message}
          onClose={() => setNotification(null)}
          onClick={handleClick}
        />
      )}
    </>
  );
}
