import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Profile, TimeEntry } from '@/types/panel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LogIn, Clock, Play, Pause, Activity, Users } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { de } from 'date-fns/locale';

interface ActivityLog {
  id: string;
  user_id: string;
  activity_type: string;
  metadata: Record<string, any> | null;
  created_at: string;
}

interface CombinedActivity {
  id: string;
  user_id: string;
  type: 'login' | 'check_in' | 'check_out' | 'pause_start' | 'pause_end';
  timestamp: string;
  profile?: Profile;
}

const activityConfig: Record<string, { icon: typeof LogIn; label: string; color: string }> = {
  login: { icon: LogIn, label: 'Angemeldet', color: 'bg-blue-500/20 text-blue-600 dark:text-blue-400' },
  check_in: { icon: Play, label: 'Eingestempelt', color: 'bg-green-500/20 text-green-600 dark:text-green-400' },
  check_out: { icon: Clock, label: 'Ausgestempelt', color: 'bg-red-500/20 text-red-600 dark:text-red-400' },
  pause_start: { icon: Pause, label: 'Pause begonnen', color: 'bg-amber-500/20 text-amber-600 dark:text-amber-400' },
  pause_end: { icon: Play, label: 'Pause beendet', color: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' },
};

export default function AdminActivityView() {
  const [activities, setActivities] = useState<CombinedActivity[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();

    // Realtime subscription for new activities
    const activityChannel = supabase
      .channel('admin-activity-logs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_logs' }, () => {
        fetchActivities();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'time_entries' }, () => {
        fetchActivities();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(activityChannel);
    };
  }, []);

  const fetchActivities = async () => {
    try {
      // Fetch login activities
      const { data: loginLogs } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('activity_type', 'login')
        .order('created_at', { ascending: false })
        .limit(50);

      // Fetch time entries (today and yesterday)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const { data: timeEntries } = await supabase
        .from('time_entries')
        .select('*')
        .gte('timestamp', yesterday.toISOString())
        .order('timestamp', { ascending: false })
        .limit(50);

      // Get all unique user IDs
      const userIds = new Set<string>();
      loginLogs?.forEach(log => userIds.add(log.user_id));
      timeEntries?.forEach(entry => userIds.add(entry.user_id));

      // Fetch profiles
      if (userIds.size > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('*')
          .in('user_id', Array.from(userIds));

        if (profilesData) {
          const profileMap: Record<string, Profile> = {};
          profilesData.forEach(p => {
            profileMap[p.user_id] = p as Profile;
          });
          setProfiles(profileMap);
        }
      }

      // Combine and sort activities
      const combined: CombinedActivity[] = [];

      loginLogs?.forEach(log => {
        combined.push({
          id: log.id,
          user_id: log.user_id,
          type: 'login',
          timestamp: log.created_at,
        });
      });

      timeEntries?.forEach(entry => {
        combined.push({
          id: entry.id,
          user_id: entry.user_id,
          type: entry.entry_type as CombinedActivity['type'],
          timestamp: entry.timestamp,
        });
      });

      // Sort by timestamp descending
      combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setActivities(combined.slice(0, 50));
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    if (isToday(date)) {
      return `Heute, ${format(date, 'HH:mm', { locale: de })} Uhr`;
    } else if (isYesterday(date)) {
      return `Gestern, ${format(date, 'HH:mm', { locale: de })} Uhr`;
    }
    return format(date, "dd.MM.yyyy 'um' HH:mm 'Uhr'", { locale: de });
  };

  const getAvatarUrl = (profile?: Profile) => {
    if (!profile?.avatar_url) return null;
    return supabase.storage.from('avatars').getPublicUrl(profile.avatar_url).data.publicUrl;
  };

  // Group activities by date
  const groupedActivities = activities.reduce((groups, activity) => {
    const date = new Date(activity.timestamp);
    let key: string;
    if (isToday(date)) {
      key = 'Heute';
    } else if (isYesterday(date)) {
      key = 'Gestern';
    } else {
      key = format(date, 'dd. MMMM yyyy', { locale: de });
    }
    
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(activity);
    return groups;
  }, {} as Record<string, CombinedActivity[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Activity className="h-8 w-8 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Mitarbeiter-Aktivität</h2>
          <p className="text-muted-foreground">Logins und Zeiterfassung in Echtzeit</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <LogIn className="h-4 w-4" />
              Logins heute
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {activities.filter(a => a.type === 'login' && isToday(new Date(a.timestamp))).length}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Play className="h-4 w-4" />
              Eingestempelt heute
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {activities.filter(a => a.type === 'check_in' && isToday(new Date(a.timestamp))).length}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Aktive Mitarbeiter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {new Set(activities.filter(a => isToday(new Date(a.timestamp))).map(a => a.user_id)).size}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Aktivitäts-Feed
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            {activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Activity className="h-12 w-12 mb-4 opacity-50" />
                <p>Keine Aktivitäten gefunden</p>
              </div>
            ) : (
              Object.entries(groupedActivities).map(([dateLabel, dateActivities]) => (
                <div key={dateLabel}>
                  <div className="sticky top-0 bg-muted/80 backdrop-blur-sm px-4 py-2 border-b">
                    <p className="text-sm font-semibold text-muted-foreground">{dateLabel}</p>
                  </div>
                  {dateActivities.map((activity) => {
                    const config = activityConfig[activity.type] || activityConfig.login;
                    const IconComponent = config.icon;
                    const profile = profiles[activity.user_id];

                    return (
                      <div
                        key={activity.id}
                        className="flex items-center gap-4 px-4 py-3 border-b hover:bg-muted/30 transition-colors"
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={getAvatarUrl(profile) || ''} />
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {profile ? `${profile.first_name} ${profile.last_name}` : 'Unbekannt'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(activity.timestamp), 'HH:mm', { locale: de })} Uhr
                          </p>
                        </div>

                        <Badge className={`gap-1.5 ${config.color}`}>
                          <IconComponent className="h-3 w-3" />
                          {config.label}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
