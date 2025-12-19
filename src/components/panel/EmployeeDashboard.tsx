import { useState, createContext, useContext, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, ClipboardList, Clock, FileText, Calendar, User, Menu, X, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import logo from '@/assets/logo.png';
import EmployeeTasksView from './employee/EmployeeTasksView';
import EmployeeTimeView from './employee/EmployeeTimeView';
import EmployeeDocumentsView from './employee/EmployeeDocumentsView';
import EmployeeVacationView from './employee/EmployeeVacationView';
import EmployeeProfileView from './employee/EmployeeProfileView';
import EmployeeNotificationsView from './employee/EmployeeNotificationsView';
import { StatusSelector } from './StatusSelector';
import { cn } from '@/lib/utils';

// Context to share tab navigation with optional pending task
interface TabContextValue {
  setActiveTab: (tab: string) => void;
  pendingTaskId: string | null;
  setPendingTaskId: (taskId: string | null) => void;
}
export const TabContext = createContext<TabContextValue | null>(null);
export const useTabContext = () => useContext(TabContext);

const menuItems = [
  { id: 'tasks', label: 'Aufträge', icon: ClipboardList },
  { id: 'time', label: 'Zeiterfassung', icon: Clock },
  { id: 'documents', label: 'Dokumente', icon: FileText },
  { id: 'vacation', label: 'Urlaub', icon: Calendar },
  { id: 'notifications', label: 'Benachrichtigungen', icon: Bell },
  { id: 'profile', label: 'Profil', icon: User },
];

export default function EmployeeDashboard() {
  const [activeTab, setActiveTab] = useState('tasks');
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userStatus, setUserStatus] = useState<'online' | 'away' | 'busy' | 'offline'>('offline');
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const { profile, signOut, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch unread notifications count and listen for new status requests
  useEffect(() => {
    if (!user) return;

    const fetchUnreadCount = async () => {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .is('read_at', null);
      
      setUnreadNotifications(count || 0);
    };

    fetchUnreadCount();

    const channel = supabase
      .channel('notification-count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, fetchUnreadCount)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications'
      }, (payload) => {
        // Show toast for status requests
        if (payload.new.user_id === user.id && payload.new.type === 'status_request') {
          toast({
            title: payload.new.title,
            description: 'Bitte gehe zum Auftrag und trage deinen Fortschritt ein.',
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  useEffect(() => {
    if (profile?.avatar_url) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(profile.avatar_url);
      setAvatarUrl(data.publicUrl);
    }
    // Fetch current status
    if (profile?.user_id) {
      supabase
        .from('profiles')
        .select('status')
        .eq('user_id', profile.user_id)
        .single()
        .then(({ data }) => {
          if (data?.status) {
            setUserStatus(data.status as typeof userStatus);
          }
        });
    }
  }, [profile]);

  // Listen for profile updates
  useEffect(() => {
    if (!profile?.user_id) return;
    
    const channel = supabase
      .channel('profile-updates')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'profiles',
        filter: `user_id=eq.${profile.user_id}`
      }, (payload) => {
        if (payload.new?.avatar_url) {
          const { data } = supabase.storage.from('avatars').getPublicUrl(payload.new.avatar_url as string);
          setAvatarUrl(data.publicUrl);
        }
        if (payload.new?.status) {
          setUserStatus(payload.new.status as typeof userStatus);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.user_id]);

  const handleSignOut = async () => {
    // Set status to offline
    if (profile?.user_id) {
      await supabase
        .from('profiles')
        .update({ status: 'offline' })
        .eq('user_id', profile.user_id);
    }
    await signOut();
    navigate('/panel/login');
  };

  const handleLogoClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setActiveTab('tasks');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'tasks': return <EmployeeTasksView />;
      case 'time': return <EmployeeTimeView />;
      case 'documents': return <EmployeeDocumentsView />;
      case 'vacation': return <EmployeeVacationView />;
      case 'notifications': return <EmployeeNotificationsView />;
      case 'profile': return <EmployeeProfileView />;
      default: return <EmployeeTasksView />;
    }
  };

  const statusColors: Record<string, string> = {
    online: 'bg-green-500',
    away: 'bg-yellow-500',
    busy: 'bg-red-500',
    offline: 'bg-gray-400'
  };

  return (
    <TabContext.Provider value={{ setActiveTab, pendingTaskId, setPendingTaskId }}>
      <div className="min-h-screen bg-background flex">
        {/* Sidebar */}
        <aside className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-card/95 backdrop-blur-xl border-r border-border/50 transition-all duration-300 shadow-xl",
          sidebarOpen ? "w-64" : "w-0 md:w-16"
        )}>
          {/* Logo */}
          <div className={cn(
            "h-20 flex items-center border-b border-border/30 px-4",
            !sidebarOpen && "md:justify-center md:px-2"
          )}>
            <div 
              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-all"
              onClick={handleLogoClick}
            >
              <img src={logo} alt="Logo" className="h-12 w-auto" />
              {sidebarOpen && (
                <span className="font-bold text-lg bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Mitarbeiter</span>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-6 overflow-y-auto">
            <ul className="space-y-1.5 px-3">
              {menuItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveTab(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 relative",
                      activeTab === item.id 
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" 
                        : "hover:bg-muted/80 text-muted-foreground hover:text-foreground",
                      !sidebarOpen && "md:justify-center md:px-2"
                    )}
                  >
                    <div className="relative">
                      <item.icon className={cn("h-5 w-5 shrink-0", activeTab === item.id && "animate-pulse")} />
                      {item.id === 'notifications' && unreadNotifications > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                          {unreadNotifications > 9 ? '9+' : unreadNotifications}
                        </span>
                      )}
                    </div>
                    {sidebarOpen && (
                      <span className="font-medium flex-1">{item.label}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* User info at bottom */}
          {sidebarOpen && (
            <div className="p-4 border-t border-border/30 bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-11 w-11 ring-2 ring-primary/30 shadow-lg">
                    {avatarUrl ? (
                      <AvatarImage src={avatarUrl} alt={`${profile?.first_name} ${profile?.last_name}`} />
                    ) : null}
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                      {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className={`absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full border-2 border-card ${statusColors[userStatus]} shadow-sm`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{profile?.first_name} {profile?.last_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Main content */}
        <div className={cn(
          "flex-1 transition-all duration-300",
          sidebarOpen ? "ml-64" : "ml-0 md:ml-16"
        )}>
          {/* Header */}
          <header className="sticky top-0 z-40 h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-full items-center justify-between px-4 md:px-6">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="shrink-0"
              >
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>

              <div className="flex items-center gap-2">
                <StatusSelector />
                <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 bg-muted/50 rounded-full">
                  <div className="relative">
                    <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                      {avatarUrl ? (
                        <AvatarImage src={avatarUrl} alt={`${profile?.first_name} ${profile?.last_name}`} />
                      ) : null}
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                        {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-muted/50 ${statusColors[userStatus]}`} />
                  </div>
                  <span className="text-sm font-medium">{profile?.first_name}</span>
                </div>
                <ThemeToggle />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleSignOut} 
                  title="Abmelden"
                  className="hover:bg-destructive/10 hover:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="p-4 md:p-6 lg:p-8 animate-fade-in">
            {renderContent()}
          </main>
        </div>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>
    </TabContext.Provider>
  );
}
