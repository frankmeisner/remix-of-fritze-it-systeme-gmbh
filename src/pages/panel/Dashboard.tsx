import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import AdminDashboard from '@/components/panel/AdminDashboard';
import EmployeeDashboard from '@/components/panel/EmployeeDashboard';
import { Loader2 } from 'lucide-react';

export default function Dashboard() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/panel/login');
    }
  }, [user, loading, navigate]);

  if (loading || (user && !role)) {
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

  return role === 'admin' ? <AdminDashboard /> : <EmployeeDashboard />;
}
