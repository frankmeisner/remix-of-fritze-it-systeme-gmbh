import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import AdminDashboard from '@/components/panel/AdminDashboard';
import EmployeeDashboard from '@/components/panel/EmployeeDashboard';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const { user, role, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/panel/login');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3 glass-panel rounded-xl px-6 py-4">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Panel wird geladen…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!role) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="glass-card max-w-md w-full p-6 space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <h1 className="text-lg font-semibold">Panel konnte nicht geladen werden</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Deine Rolle konnte nicht ermittelt werden. Bitte erneut anmelden.
          </p>
          <div className="flex gap-2">
            <Button
              variant="neon"
              onClick={() => window.location.reload()}
              className="flex-1"
            >
              Neu laden
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                await signOut();
                navigate('/panel/login');
              }}
              className="flex-1"
            >
              Abmelden
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return role === 'admin' ? <AdminDashboard /> : <EmployeeDashboard />;
}
