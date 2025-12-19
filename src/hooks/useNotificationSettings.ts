import { useState, useEffect, useCallback } from 'react';

export interface NotificationSettings {
  soundEnabled: boolean;
  pushEnabled: boolean;
}

const STORAGE_KEY = 'notification-settings';

const defaultSettings: NotificationSettings = {
  soundEnabled: true,
  pushEnabled: true,
};

export function useNotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    } catch (error) {
      console.warn('Could not load notification settings:', error);
    }
  }, []);

  // Save settings to localStorage
  const saveSettings = useCallback((newSettings: NotificationSettings) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.warn('Could not save notification settings:', error);
    }
  }, []);

  const toggleSound = useCallback(() => {
    saveSettings({ ...settings, soundEnabled: !settings.soundEnabled });
  }, [settings, saveSettings]);

  const togglePush = useCallback(() => {
    saveSettings({ ...settings, pushEnabled: !settings.pushEnabled });
  }, [settings, saveSettings]);

  return {
    settings,
    toggleSound,
    togglePush,
    saveSettings,
  };
}
