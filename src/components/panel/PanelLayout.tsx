import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logo from '@/assets/logo.png';

interface PanelLayoutProps {
  children: ReactNode;
  title: string;
  onLogoClick?: () => void;
}

export default function PanelLayout({ children, title, onLogoClick }: PanelLayoutProps) {
  const { profile, role, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/panel/login');
  };

  const handleLogoClick = () => {
    if (onLogoClick) {
      onLogoClick();
    }
  };

  const avatarUrl = profile?.avatar_url;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container max-w-7xl flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <img 
              src={logo} 
              alt="Fritze IT" 
              className="h-10 cursor-pointer hover:opacity-80 transition-opacity" 
              onClick={handleLogoClick}
            />
            <div className="hidden sm:block">
              <h1 className="text-lg font-semibold">{title}</h1>
              <p className="text-xs text-muted-foreground capitalize">
                {role === 'admin' ? 'Administrator' : 'Mitarbeiter'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3">
              <Avatar className="h-8 w-8">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt={`${profile?.first_name} ${profile?.last_name}`} />
                ) : null}
                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                  {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="text-sm">
                <p className="font-medium">{profile?.first_name} {profile?.last_name}</p>
                <p className="text-xs text-muted-foreground">{profile?.email}</p>
              </div>
            </div>
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={handleSignOut} title="Abmelden">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>
      
      <main className="container max-w-7xl py-8 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
