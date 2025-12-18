import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Profile, ChatMessage } from '@/types/panel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Send, MessageCircle, Users, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function EmployeeChatView() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [privateMessages, setPrivateMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [newPrivateMessage, setNewPrivateMessage] = useState('');
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [unreadPrivate, setUnreadPrivate] = useState(0);
  const [activeTab, setActiveTab] = useState('team');
  const { toast } = useToast();
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const privateScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchMessages();
      fetchPrivateMessages();
      fetchProfiles();

      const channel = supabase
        .channel('chat-messages')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
          const newMsg = payload.new as ChatMessage;
          if (newMsg.is_group_message) {
            setMessages(prev => [...prev, newMsg]);
            scrollToBottom();
          } else if (newMsg.sender_id === user.id || newMsg.recipient_id === user.id) {
            setPrivateMessages(prev => [...prev, newMsg]);
            scrollToBottomPrivate();
            // Show notification if it's from admin and we're not on private tab
            if (newMsg.recipient_id === user.id && activeTab !== 'private') {
              setUnreadPrivate(prev => prev + 1);
              toast({ 
                title: 'Neue Nachricht', 
                description: 'Du hast eine private Nachricht erhalten.',
              });
            }
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, activeTab]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    scrollToBottomPrivate();
  }, [privateMessages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const scrollToBottomPrivate = () => {
    setTimeout(() => {
      privateScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('chat_messages' as any)
      .select('*')
      .eq('is_group_message', true)
      .order('created_at', { ascending: true })
      .limit(100);

    if (data && !error) {
      setMessages(data as unknown as ChatMessage[]);
    }
  };

  const fetchPrivateMessages = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('chat_messages' as any)
      .select('*')
      .eq('is_group_message', false)
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order('created_at', { ascending: true })
      .limit(100);

    if (data && !error) {
      setPrivateMessages(data as unknown as ChatMessage[]);
      // Count unread
      const unread = (data as any[]).filter(m => m.recipient_id === user.id && !m.read_at).length;
      setUnreadPrivate(unread);
    }
  };

  const fetchProfiles = async () => {
    const { data } = await supabase.from('profiles').select('*');
    if (data) {
      const profileMap: Record<string, Profile> = {};
      (data as unknown as Profile[]).forEach((p) => {
        profileMap[p.user_id] = p;
      });
      setProfiles(profileMap);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    const { error } = await supabase.from('chat_messages' as any).insert({
      sender_id: user.id,
      message: newMessage.trim(),
      is_group_message: true
    } as any);

    if (error) {
      toast({ title: 'Fehler', description: 'Nachricht konnte nicht gesendet werden.', variant: 'destructive' });
    } else {
      setNewMessage('');
    }
  };

  const handleSendPrivateMessage = async () => {
    if (!newPrivateMessage.trim() || !user) return;

    // Find admin user to reply to
    const adminProfile = Object.values(profiles).find(async p => {
      const { data } = await supabase.from('user_roles').select('role').eq('user_id', p.user_id).single();
      return data?.role === 'admin';
    });

    // Get the last message sender (admin) to reply
    const lastAdminMessage = [...privateMessages].reverse().find(m => m.sender_id !== user.id);
    const recipientId = lastAdminMessage?.sender_id;

    if (!recipientId) {
      toast({ title: 'Fehler', description: 'Kein Empfänger gefunden.', variant: 'destructive' });
      return;
    }

    const { error } = await supabase.from('chat_messages' as any).insert({
      sender_id: user.id,
      recipient_id: recipientId,
      message: newPrivateMessage.trim(),
      is_group_message: false
    } as any);

    if (error) {
      toast({ title: 'Fehler', description: 'Nachricht konnte nicht gesendet werden.', variant: 'destructive' });
    } else {
      setNewPrivateMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, isPrivate: boolean = false) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (isPrivate) {
        handleSendPrivateMessage();
      } else {
        handleSendMessage();
      }
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'private') {
      setUnreadPrivate(0);
      // Mark messages as read
      if (user) {
        supabase
          .from('chat_messages' as any)
          .update({ read_at: new Date().toISOString() } as any)
          .eq('recipient_id', user.id)
          .is('read_at', null)
          .then(() => {});
      }
    }
  };

  const getProfileAvatar = (userId: string) => {
    const p = profiles[userId];
    if (!p?.avatar_url) return null;
    const { data } = supabase.storage.from('avatars').getPublicUrl(p.avatar_url);
    return data.publicUrl;
  };

  const renderMessages = (msgs: ChatMessage[], scrollRefEl: React.RefObject<HTMLDivElement>) => (
    <ScrollArea className="flex-1 p-4">
      <div className="space-y-4">
        {msgs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <MessageCircle className="h-12 w-12 mb-4 opacity-50" />
            <p>Noch keine Nachrichten.</p>
          </div>
        ) : (
          msgs.map((msg) => {
            const isOwn = msg.sender_id === user?.id;
            const senderProfile = profiles[msg.sender_id];
            
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={getProfileAvatar(msg.sender_id) || ''} />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {senderProfile?.first_name?.[0]}{senderProfile?.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
                  <div className={`flex items-center gap-2 mb-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
                    <span className="text-xs font-medium">
                      {isOwn ? 'Du' : `${senderProfile?.first_name || 'Unbekannt'}`}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(msg.created_at), 'HH:mm', { locale: de })}
                    </span>
                  </div>
                  <div
                    className={`p-3 rounded-2xl ${
                      isOwn
                        ? 'bg-primary text-primary-foreground rounded-tr-sm'
                        : 'bg-muted rounded-tl-sm'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={scrollRefEl} />
      </div>
    </ScrollArea>
  );

  return (
    <div className="h-[calc(100vh-12rem)]">
      <Card className="shadow-lg h-full flex flex-col">
        <CardHeader className="pb-3 border-b">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="team" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Team-Chat
              </TabsTrigger>
              <TabsTrigger value="private" className="flex items-center gap-2 relative">
                <Mail className="h-4 w-4" />
                Privat
                {unreadPrivate > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs">
                    {unreadPrivate}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          {activeTab === 'team' ? (
            <>
              {renderMessages(messages, scrollRef)}
              <div className="p-4 border-t bg-background">
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, false)}
                    placeholder="Nachricht an Team schreiben..."
                    className="flex-1"
                  />
                  <Button onClick={handleSendMessage} disabled={!newMessage.trim()} size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <>
              {renderMessages(privateMessages, privateScrollRef)}
              {privateMessages.length > 0 && (
                <div className="p-4 border-t bg-background">
                  <div className="flex gap-2">
                    <Input
                      value={newPrivateMessage}
                      onChange={(e) => setNewPrivateMessage(e.target.value)}
                      onKeyPress={(e) => handleKeyPress(e, true)}
                      placeholder="Antwort schreiben..."
                      className="flex-1"
                    />
                    <Button onClick={handleSendPrivateMessage} disabled={!newPrivateMessage.trim()} size="icon">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}