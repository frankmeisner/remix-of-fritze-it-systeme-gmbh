import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TimeEntry, TimeEntryType } from '@/types/panel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Clock, Play, Pause, Square, Coffee } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const entryTypeLabels: Record<TimeEntryType, string> = {
  check_in: 'Eingestempelt',
  check_out: 'Ausgestempelt',
  pause_start: 'Pause gestartet',
  pause_end: 'Pause beendet'
};

const entryTypeIcons: Record<TimeEntryType, React.ReactNode> = {
  check_in: <Play className="h-4 w-4" />,
  check_out: <Square className="h-4 w-4" />,
  pause_start: <Coffee className="h-4 w-4" />,
  pause_end: <Play className="h-4 w-4" />
};

export default function EmployeeTimeView() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [currentStatus, setCurrentStatus] = useState<'out' | 'in' | 'paused'>('out');
  const [todayWorkTime, setTodayWorkTime] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchEntries();
    }
  }, [user]);

  const fetchEntries = async () => {
    if (!user) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data } = await supabase
      .from('time_entries')
      .select('*')
      .eq('user_id', user.id)
      .gte('timestamp', today.toISOString())
      .order('timestamp', { ascending: true });

    if (data) {
      const typedEntries = data as TimeEntry[];
      setEntries(typedEntries);
      calculateStatus(typedEntries);
      calculateWorkTime(typedEntries);
    }
  };

  const calculateStatus = (entries: TimeEntry[]) => {
    if (entries.length === 0) {
      setCurrentStatus('out');
      return;
    }

    const latestEntry = entries[entries.length - 1];
    switch (latestEntry.entry_type) {
      case 'check_in':
      case 'pause_end':
        setCurrentStatus('in');
        break;
      case 'pause_start':
        setCurrentStatus('paused');
        break;
      case 'check_out':
        setCurrentStatus('out');
        break;
    }
  };

  const calculateWorkTime = (entries: TimeEntry[]) => {
    if (entries.length === 0) {
      setTodayWorkTime(0);
      return;
    }

    let totalMs = 0;
    let checkInTime: number | null = null;
    let pauseStartTime: number | null = null;
    let accumulatedPause = 0;

    for (const entry of entries) {
      const timestamp = new Date(entry.timestamp).getTime();
      
      switch (entry.entry_type) {
        case 'check_in':
          checkInTime = timestamp;
          accumulatedPause = 0;
          break;
        case 'check_out':
          if (checkInTime !== null) {
            const workDuration = timestamp - checkInTime - accumulatedPause;
            totalMs += Math.max(0, workDuration);
            checkInTime = null;
            accumulatedPause = 0;
          }
          break;
        case 'pause_start':
          pauseStartTime = timestamp;
          break;
        case 'pause_end':
          if (pauseStartTime !== null) {
            accumulatedPause += timestamp - pauseStartTime;
            pauseStartTime = null;
          }
          break;
      }
    }

    // If still checked in, calculate current work time
    if (checkInTime !== null) {
      const now = Date.now();
      let currentPause = accumulatedPause;
      
      // If currently paused, add ongoing pause time
      if (pauseStartTime !== null) {
        currentPause += now - pauseStartTime;
      }
      
      const workDuration = now - checkInTime - currentPause;
      totalMs += Math.max(0, workDuration);
    }

    setTodayWorkTime(totalMs);
  };

  const handleTimeEntry = async (type: TimeEntryType) => {
    if (!user) return;

    const { error } = await supabase.from('time_entries').insert({
      user_id: user.id,
      entry_type: type
    });

    if (error) {
      toast({ title: 'Fehler', description: 'Zeiterfassung fehlgeschlagen.', variant: 'destructive' });
    } else {
      const messages: Record<TimeEntryType, string> = {
        check_in: 'Erfolgreich eingestempelt!',
        check_out: 'Erfolgreich ausgestempelt!',
        pause_start: 'Pause gestartet.',
        pause_end: 'Pause beendet.'
      };
      toast({ title: 'Erfolg', description: messages[type] });
      fetchEntries();
    }
  };

  const formatTime = (ms: number) => {
    if (ms < 0) ms = 0;
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  // Reverse for display (newest first)
  const displayEntries = [...entries].reverse();

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Zeiterfassung</h2>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Aktueller Status</span>
            <Badge className={
              currentStatus === 'in' ? 'bg-green-500/20 text-green-700 dark:text-green-400' :
              currentStatus === 'paused' ? 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400' :
              'bg-gray-500/20 text-gray-700 dark:text-gray-400'
            }>
              {currentStatus === 'in' ? 'Eingestempelt' : currentStatus === 'paused' ? 'Pause' : 'Ausgestempelt'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground mb-2">Arbeitszeit heute</p>
              <p className="text-5xl font-bold flex items-center justify-center gap-3">
                <Clock className="h-10 w-10 text-primary" />
                {formatTime(todayWorkTime)}
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              {currentStatus === 'out' && (
                <Button size="lg" onClick={() => handleTimeEntry('check_in')} className="gap-2 bg-green-600 hover:bg-green-700">
                  <Play className="h-5 w-5" />
                  Einstempeln
                </Button>
              )}
              {currentStatus === 'in' && (
                <>
                  <Button size="lg" variant="outline" onClick={() => handleTimeEntry('pause_start')} className="gap-2">
                    <Coffee className="h-5 w-5" />
                    Pause starten
                  </Button>
                  <Button size="lg" variant="destructive" onClick={() => handleTimeEntry('check_out')} className="gap-2">
                    <Square className="h-5 w-5" />
                    Ausstempeln
                  </Button>
                </>
              )}
              {currentStatus === 'paused' && (
                <>
                  <Button size="lg" onClick={() => handleTimeEntry('pause_end')} className="gap-2 bg-green-600 hover:bg-green-700">
                    <Play className="h-5 w-5" />
                    Pause beenden
                  </Button>
                  <Button size="lg" variant="destructive" onClick={() => handleTimeEntry('check_out')} className="gap-2">
                    <Square className="h-5 w-5" />
                    Ausstempeln
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Heutige Einträge</CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Keine Einträge für heute.</p>
          ) : (
            <div className="space-y-2">
              {displayEntries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      entry.entry_type === 'check_in' ? 'bg-green-500/20 text-green-700 dark:text-green-400' :
                      entry.entry_type === 'check_out' ? 'bg-red-500/20 text-red-700 dark:text-red-400' :
                      'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400'
                    }`}>
                      {entryTypeIcons[entry.entry_type]}
                    </div>
                    <span className="font-medium">{entryTypeLabels[entry.entry_type]}</span>
                  </div>
                  <span className="text-sm text-muted-foreground font-mono">
                    {format(new Date(entry.timestamp), 'HH:mm', { locale: de })} Uhr
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
