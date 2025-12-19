import { Bell, BellOff, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export function NotificationSettings() {
  const { settings, toggleSound, togglePush } = useNotificationSettings();
  const { permission, requestPermission, isSupported } = usePushNotifications();

  const handlePushToggle = async () => {
    if (!settings.pushEnabled && permission !== 'granted') {
      const granted = await requestPermission();
      if (granted) {
        togglePush();
      }
    } else {
      togglePush();
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          {settings.soundEnabled || settings.pushEnabled ? (
            <Bell className="h-5 w-5" />
          ) : (
            <BellOff className="h-5 w-5 text-muted-foreground" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <div className="space-y-4">
          <div className="space-y-1">
            <h4 className="font-medium leading-none">Benachrichtigungen</h4>
            <p className="text-sm text-muted-foreground">
              Einstellungen für Benachrichtigungen
            </p>
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            {/* Sound Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {settings.soundEnabled ? (
                  <Volume2 className="h-4 w-4 text-primary" />
                ) : (
                  <VolumeX className="h-4 w-4 text-muted-foreground" />
                )}
                <Label htmlFor="sound-toggle" className="cursor-pointer">
                  Ton-Benachrichtigung
                </Label>
              </div>
              <Switch
                id="sound-toggle"
                checked={settings.soundEnabled}
                onCheckedChange={toggleSound}
              />
            </div>

            {/* Push Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {settings.pushEnabled ? (
                  <Bell className="h-4 w-4 text-primary" />
                ) : (
                  <BellOff className="h-4 w-4 text-muted-foreground" />
                )}
                <div>
                  <Label htmlFor="push-toggle" className="cursor-pointer">
                    Push-Benachrichtigung
                  </Label>
                  {!isSupported && (
                    <p className="text-xs text-muted-foreground">
                      Nicht unterstützt
                    </p>
                  )}
                  {isSupported && permission === 'denied' && (
                    <p className="text-xs text-destructive">
                      Im Browser blockiert
                    </p>
                  )}
                </div>
              </div>
              <Switch
                id="push-toggle"
                checked={settings.pushEnabled && permission === 'granted'}
                onCheckedChange={handlePushToggle}
                disabled={!isSupported || permission === 'denied'}
              />
            </div>
          </div>

          {permission === 'denied' && (
            <>
              <Separator />
              <p className="text-xs text-muted-foreground">
                Push-Benachrichtigungen wurden im Browser blockiert. 
                Bitte aktiviere sie in den Browser-Einstellungen.
              </p>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
