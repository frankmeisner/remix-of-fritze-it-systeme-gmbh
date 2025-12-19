import { useCallback, useEffect, useState } from 'react';
import { useNotificationSettings } from './useNotificationSettings';

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const { settings } = useNotificationSettings();

  useEffect(() => {
    // Check if notifications are supported
    if ('Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.warn('Could not request notification permission:', error);
      return false;
    }
  }, [isSupported]);

  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    // Check if push notifications are enabled in settings
    if (!settings.pushEnabled) {
      return null;
    }

    if (!isSupported || permission !== 'granted') {
      console.log('Notifications not available or not permitted');
      return null;
    }

    try {
      const notification = new Notification(title, {
        icon: '/favicon.png',
        badge: '/favicon.png',
        ...options,
      });

      // Auto-close after 5 seconds
      setTimeout(() => notification.close(), 5000);

      // Focus window when clicked
      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return notification;
    } catch (error) {
      console.warn('Could not show notification:', error);
      return null;
    }
  }, [isSupported, permission, settings.pushEnabled]);

  return {
    isSupported,
    permission,
    requestPermission,
    showNotification,
  };
}
