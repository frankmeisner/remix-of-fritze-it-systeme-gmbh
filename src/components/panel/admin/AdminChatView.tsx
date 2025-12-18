import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Profile, ChatMessage } from '@/types/panel';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Send, MessageCircle, Check, CheckCheck, ImagePlus, X, Users } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { getStatusColor } from '../StatusSelector';

type UserStatus = 'online' | 'away' | 'busy' | 'offline';

interface ProfileWithStatus extends Profile {
  status?: UserStatus;
}

interface ExtendedChatMessage extends ChatMessage {
  image_url?: string | null;
}

export default function AdminChatView() {
  const [messages, setMessages] = useState<ExtendedChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [profiles, setProfiles] = useState<Record<string, ProfileWithStatus>>({});
  const [employees, setEmployees] = useState<ProfileWithStatus[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfiles();
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (user && selectedEmployee) {
      fetchMessages();
      markMessagesAsRead();

      const channel = supabase
        .channel('admin-chat-messages')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
          const newMsg = payload.new as ExtendedChatMessage;
          if (!newMsg.is_group_message && 
              ((newMsg.sender_id === user.id && newMsg.recipient_id === selectedEmployee) ||
               (newMsg.sender_id === selectedEmployee && newMsg.recipient_id === user.id))) {
            setMessages(prev => [...prev, newMsg]);
            scrollToBottom();
            
            if (newMsg.recipient_id === user.id) {
              markMessageAsRead(newMsg.id);
            }
          }
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_messages' }, (payload) => {
          const updatedMsg = payload.new as ExtendedChatMessage;
          setMessages(prev => prev.map(m => m.id === updatedMsg.id ? updatedMsg : m));
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, selectedEmployee]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const markMessageAsRead = async (messageId: string) => {
    await supabase
      .from('chat_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('id', messageId);
  };

  const markMessagesAsRead = async () => {
    if (!user || !selectedEmployee) return;
    await supabase
      .from('chat_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('recipient_id', user.id)
      .eq('sender_id', selectedEmployee)
      .is('read_at', null)
      .eq('is_group_message', false);
  };

  const fetchMessages = async () => {
    if (!user || !selectedEmployee) return;
    
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('is_group_message', false)
      .or(`and(sender_id.eq.${user.id},recipient_id.eq.${selectedEmployee}),and(sender_id.eq.${selectedEmployee},recipient_id.eq.${user.id})`)
      .order('created_at', { ascending: true })
      .limit(100);

    if (data && !error) {
      setMessages(data as ExtendedChatMessage[]);
    }
  };

  const fetchProfiles = async () => {
    const { data } = await supabase.from('profiles').select('*');
    if (data) {
      const profileMap: Record<string, ProfileWithStatus> = {};
      (data as any[]).forEach((p) => {
        profileMap[p.user_id] = { ...p, status: p.status || 'offline' };
      });
      setProfiles(profileMap);
    }
  };

  const fetchEmployees = async () => {
    const { data: roles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'employee');
    
    if (roles) {
      const employeeIds = roles.map(r => r.user_id);
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', employeeIds);
      
      if (profileData) {
        setEmployees(profileData.map(p => ({ ...p, status: (p as any).status || 'offline' })) as ProfileWithStatus[]);
      }
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: 'Fehler', description: 'Bild darf maximal 5MB groß sein.', variant: 'destructive' });
        return;
      }
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!selectedImage || !user) return null;

    const fileExt = selectedImage.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from('chat-images')
      .upload(fileName, selectedImage);

    if (error) {
      toast({ title: 'Fehler', description: 'Bild konnte nicht hochgeladen werden.', variant: 'destructive' });
      return null;
    }

    const { data } = supabase.storage.from('chat-images').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !selectedImage) || !user || !selectedEmployee) return;

    setUploading(true);
    let imageUrl: string | null = null;

    if (selectedImage) {
      imageUrl = await uploadImage();
      if (!imageUrl && selectedImage) {
        setUploading(false);
        return;
      }
    }

    const { error } = await supabase.from('chat_messages').insert({
      sender_id: user.id,
      recipient_id: selectedEmployee,
      message: newMessage.trim() || '',
      is_group_message: false,
      image_url: imageUrl
    });

    setUploading(false);

    if (error) {
      toast({ title: 'Fehler', description: 'Nachricht konnte nicht gesendet werden.', variant: 'destructive' });
    } else {
      setNewMessage('');
      clearImage();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getProfileAvatar = (userId: string) => {
    const p = profiles[userId];
    if (!p?.avatar_url) return null;
    const { data } = supabase.storage.from('avatars').getPublicUrl(p.avatar_url);
    return data.publicUrl;
  };

  const getStatus = (userId: string): UserStatus => {
    return profiles[userId]?.status || 'offline';
  };

  const getUnreadCount = async (employeeId: string): Promise<number> => {
    if (!user) return 0;
    const { count } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('sender_id', employeeId)
      .eq('recipient_id', user.id)
      .is('read_at', null);
    return count || 0;
  };

  return (
    <div className="h-[calc(100vh-16rem)]">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-full">
        {/* Employee List */}
        <Card className="md:col-span-1 shadow-lg">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-lg">Mitarbeiter</h2>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-22rem)]">
              {employees.map((emp) => {
                const empStatus = getStatus(emp.user_id);
                return (
                  <button
                    key={emp.user_id}
                    onClick={() => setSelectedEmployee(emp.user_id)}
                    className={`w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors border-b ${
                      selectedEmployee === emp.user_id ? 'bg-muted' : ''
                    }`}
                  >
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={getProfileAvatar(emp.user_id) || ''} />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {emp.first_name?.[0]}{emp.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span 
                        className={`absolute -bottom-0.5 -left-0.5 h-3.5 w-3.5 rounded-full border-2 border-background ${getStatusColor(empStatus)}`}
                      />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-sm">{emp.first_name} {emp.last_name}</p>
                      <p className="text-xs text-muted-foreground">{emp.email}</p>
                    </div>
                  </button>
                );
              })}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="md:col-span-3 shadow-lg flex flex-col">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-lg">
                {selectedEmployee ? `Chat mit ${profiles[selectedEmployee]?.first_name || ''} ${profiles[selectedEmployee]?.last_name || ''}` : 'Wählen Sie einen Mitarbeiter'}
              </h2>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            {!selectedEmployee ? (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Wählen Sie einen Mitarbeiter aus der Liste</p>
                </div>
              </div>
            ) : (
              <>
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <MessageCircle className="h-12 w-12 mb-4 opacity-50" />
                        <p>Noch keine Nachrichten.</p>
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const isOwn = msg.sender_id === user?.id;
                        const senderProfile = profiles[msg.sender_id];
                        const senderStatus = getStatus(msg.sender_id);
                        const senderName = senderProfile 
                          ? `${senderProfile.first_name} ${senderProfile.last_name}`
                          : 'Unbekannt';
                        
                        return (
                          <div
                            key={msg.id}
                            className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
                          >
                            <div className="relative shrink-0">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={getProfileAvatar(msg.sender_id) || ''} />
                                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                  {senderProfile?.first_name?.[0]}{senderProfile?.last_name?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <span 
                                className={`absolute -bottom-0.5 -left-0.5 h-3.5 w-3.5 rounded-full border-2 border-background ${getStatusColor(senderStatus)}`}
                              />
                            </div>
                            <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
                              <div className={`flex items-center gap-2 mb-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
                                <span className="text-xs font-medium">
                                  {isOwn ? 'Du' : senderName}
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
                                {msg.image_url && (
                                  <img 
                                    src={msg.image_url} 
                                    alt="Bild" 
                                    className="max-w-full rounded-lg mb-2 max-h-64 object-contain cursor-pointer"
                                    onClick={() => window.open(msg.image_url!, '_blank')}
                                  />
                                )}
                                {msg.message && (
                                  <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                                )}
                              </div>
                              {isOwn && (
                                <div className="flex justify-end mt-1" title={msg.read_at ? `Gelesen um ${format(new Date(msg.read_at), 'HH:mm', { locale: de })}` : 'Gesendet'}>
                                  {msg.read_at ? (
                                    <CheckCheck className="h-4 w-4 text-primary" />
                                  ) : (
                                    <Check className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={scrollRef} />
                  </div>
                </ScrollArea>
                
                <div className="p-4 border-t bg-background">
                  {imagePreview && (
                    <div className="relative inline-block mb-2">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="h-20 w-20 object-cover rounded-lg"
                      />
                      <button
                        onClick={clearImage}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageSelect}
                      accept="image/*"
                      className="hidden"
                    />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => fileInputRef.current?.click()}
                      title="Bild hochladen"
                    >
                      <ImagePlus className="h-5 w-5" />
                    </Button>
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Nachricht schreiben..."
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleSendMessage} 
                      disabled={(!newMessage.trim() && !selectedImage) || uploading} 
                      size="icon"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
