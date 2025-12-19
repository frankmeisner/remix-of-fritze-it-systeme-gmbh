import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, LayoutGrid } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logo from '@/assets/logo.png';
import { supabase } from '@/integrations/supabase/client';

interface PanelLayoutProps {
  children: ReactNode;
  title: string;
  onLogoClick?: () => void;
  headerActions?: ReactNode;
}

export default function PanelLayout({ children, title, onLogoClick, headerActions }: PanelLayoutProps) {
  const { profile, role, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    // Set status to offline before signing out
    await supabase.from('profiles').update({ status: 'offline' }).eq('user_id', profile?.user_id);
    // Clear saved tab and scroll position for fresh start on next login
    sessionStorage.removeItem('adminActiveTab');
    sessionStorage.removeItem('adminScrollPosition');
    await signOut();
    navigate('/panel/login');
  };

  const handleLogoClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (onLogoClick) {
      onLogoClick();
    }
  };

  const getAvatarUrl = () => {
    if (!profile?.avatar_url) return null;
    const { data } = supabase.storage.from('avatars').getPublicUrl(profile.avatar_url);
    return data.publicUrl;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header with glassmorphism */}
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="container max-w-7xl flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <div 
              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-all group"
              onClick={handleLogoClick}
            >
              <div className="relative">
                <img 
                  src={logo} 
                  alt="Fritze IT" 
                  className="h-12 w-auto transition-transform group-hover:scale-105 dark:brightness-0 dark:invert" 
                />
                <div className="absolute inset-0 bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold tracking-tight">{title}</h1>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <LayoutGrid className="h-3 w-3" />
                  {role === 'admin' ? 'Administrator' : 'Mitarbeiter'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {headerActions}
            <div className="hidden md:flex items-center gap-3 px-4 py-2 glass-panel rounded-xl">
              <Avatar className="h-9 w-9 ring-2 ring-primary/20">
                <AvatarImage src={getAvatarUrl() || ''} alt={`${profile?.first_name} ${profile?.last_name}`} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                  {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="text-sm">
                <p className="font-semibold">{profile?.first_name} {profile?.last_name}</p>
                <p className="text-xs text-muted-foreground">{profile?.email}</p>
              </div>
            </div>
            <ThemeToggle />
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleSignOut} 
              title="Abmelden"
              className="hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>
      
      <main className="container max-w-7xl py-8 px-4 sm:px-6 lg:px-8 animate-fade-in">
        {children}
      </main>
    </div>
  );
}
