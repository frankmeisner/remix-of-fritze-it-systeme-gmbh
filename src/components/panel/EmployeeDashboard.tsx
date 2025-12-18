import { useState, createContext, useContext, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, ClipboardList, Clock, FileText, Calendar, User, MessageCircle, Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logo from '@/assets/logo.png';
import EmployeeTasksView from './employee/EmployeeTasksView';
import EmployeeTimeView from './employee/EmployeeTimeView';
import EmployeeDocumentsView from './employee/EmployeeDocumentsView';
import EmployeeVacationView from './employee/EmployeeVacationView';
import EmployeeProfileView from './employee/EmployeeProfileView';
import EmployeeChatView from './employee/EmployeeChatView';
import { cn } from '@/lib/utils';

// Context to share tab navigation
export const TabContext = createContext<{ setActiveTab: (tab: string) => void } | null>(null);
export const useTabContext = () => useContext(TabContext);

const menuItems = [
  { id: 'tasks', label: 'Aufträge', icon: ClipboardList },
  { id: 'time', label: 'Zeiterfassung', icon: Clock },
  { id: 'documents', label: 'Dokumente', icon: FileText },
  { id: 'vacation', label: 'Urlaub', icon: Calendar },
  { id: 'chat', label: 'Chat', icon: MessageCircle },
  { id: 'profile', label: 'Profil', icon: User },
];

export default function EmployeeDashboard() {
  const [activeTab, setActiveTab] = useState('tasks');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (profile?.avatar_url) {
      // Generate public URL from storage
      const { data } = supabase.storage.from('avatars').getPublicUrl(profile.avatar_url);
      setAvatarUrl(data.publicUrl);
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
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.user_id]);

  const handleSignOut = async () => {
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
      case 'chat': return <EmployeeChatView />;
      case 'profile': return <EmployeeProfileView />;
      default: return <EmployeeTasksView />;
    }
  };

  return (
    <TabContext.Provider value={{ setActiveTab }}>
      <div className="min-h-screen bg-background flex">
        {/* Sidebar */}
        <aside className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-card border-r border-border transition-all duration-300",
          sidebarOpen ? "w-64" : "w-0 md:w-16"
        )}>
          {/* Logo */}
          <div className={cn(
            "h-16 flex items-center border-b border-border px-4",
            !sidebarOpen && "md:justify-center md:px-2"
          )}>
            <div 
              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-all"
              onClick={handleLogoClick}
            >
              <img src={logo} alt="Logo" className="h-8" />
              {sidebarOpen && (
                <span className="font-bold text-lg">Mitarbeiter</span>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-4 overflow-y-auto">
            <ul className="space-y-1 px-2">
              {menuItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveTab(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all",
                      activeTab === item.id 
                        ? "bg-primary text-primary-foreground shadow-md" 
                        : "hover:bg-muted text-muted-foreground hover:text-foreground",
                      !sidebarOpen && "md:justify-center md:px-2"
                    )}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {sidebarOpen && <span className="font-medium">{item.label}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* User info at bottom */}
          {sidebarOpen && (
            <div className="p-4 border-t border-border">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                  {avatarUrl ? (
                    <AvatarImage src={avatarUrl} alt={`${profile?.first_name} ${profile?.last_name}`} />
                  ) : null}
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                    {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{profile?.first_name} {profile?.last_name}</p>
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

              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 bg-muted/50 rounded-full">
                  <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                    {avatarUrl ? (
                      <AvatarImage src={avatarUrl} alt={`${profile?.first_name} ${profile?.last_name}`} />
                    ) : null}
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
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
