import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Circle } from 'lucide-react';

// Only allow these status options (no offline manual selection)
type SelectableStatus = 'online' | 'away' | 'busy';
type UserStatus = SelectableStatus | 'offline';

const statusConfig: Record<SelectableStatus, { label: string; color: string; bgClass: string }> = {
  online: { label: 'Online', color: 'text-green-500', bgClass: 'bg-green-500' },
  away: { label: 'Abwesend', color: 'text-yellow-500', bgClass: 'bg-yellow-500' },
  busy: { label: 'Beschäftigt', color: 'text-red-500', bgClass: 'bg-red-500' },
};

const allStatusConfig: Record<UserStatus, { label: string; bgClass: string }> = {
  online: { label: 'Online', bgClass: 'bg-green-500' },
  away: { label: 'Abwesend', bgClass: 'bg-yellow-500' },
  busy: { label: 'Beschäftigt', bgClass: 'bg-red-500' },
  offline: { label: 'Offline', bgClass: 'bg-gray-400' },
};

export function StatusSelector() {
  const [status, setStatus] = useState<UserStatus>('online');
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchStatus();

      // Listen for profile status changes (e.g., if admin removes status)
      const channel = supabase
        .channel('status-selector-updates')
        .on('postgres_changes', { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'profiles',
          filter: `user_id=eq.${user.id}`
        }, (payload) => {
          const newStatus = payload.new?.status as UserStatus | null;
          if (newStatus) {
            setStatus(newStatus);
          }
        })
        .on('postgres_changes', { 
          event: 'DELETE', 
          schema: 'public', 
          table: 'profiles',
          filter: `user_id=eq.${user.id}`
        }, () => {
          // Profile was deleted - refresh page
          window.location.reload();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchStatus = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('status')
      .eq('user_id', user.id)
      .single();
    
    if (data?.status && data.status !== 'offline') {
      setStatus(data.status as UserStatus);
    } else {
      // Auto-set to online if offline
      updateStatus('online');
    }
  };

  const updateStatus = async (newStatus: SelectableStatus) => {
    if (!user) return;
    
    const { error } = await supabase
      .from('profiles')
      .update({ status: newStatus })
      .eq('user_id', user.id);
    
    if (!error) {
      setStatus(newStatus);
      // Reload page after status change
      window.location.reload();
    }
  };

  const currentStatusConfig = status === 'offline' ? allStatusConfig.online : statusConfig[status as SelectableStatus];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 h-8 px-2">
          <span className={`h-2.5 w-2.5 rounded-full ${currentStatusConfig.bgClass}`} />
          <span className="text-xs font-medium hidden sm:inline">{currentStatusConfig.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {(Object.keys(statusConfig) as SelectableStatus[]).map((key) => (
          <DropdownMenuItem
            key={key}
            onClick={() => updateStatus(key)}
            className="gap-2 cursor-pointer"
          >
            <Circle className={`h-3 w-3 fill-current ${statusConfig[key].color}`} />
            <span>{statusConfig[key].label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Export status colors for use in other components
export const getStatusColor = (status: string): string => {
  return allStatusConfig[status as UserStatus]?.bgClass || 'bg-gray-400';
};
