import { useCallback, useRef } from 'react';
import { useNotificationSettings } from './useNotificationSettings';

// Notification sound frequencies (Hz) for a pleasant chime
const NOTIFICATION_FREQUENCIES = [523.25, 659.25, 783.99]; // C5, E5, G5 chord

export function useNotificationSound() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const { settings } = useNotificationSettings();

  const playNotificationSound = useCallback(() => {
    // Check if sound is enabled
    if (!settings.soundEnabled) {
      return;
    }

    try {
      // Create AudioContext on first use (needs user interaction first in some browsers)
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const ctx = audioContextRef.current;
      const now = ctx.currentTime;

      // Play a pleasant chime sequence
      NOTIFICATION_FREQUENCIES.forEach((freq, index) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(freq, now);

        // Stagger the notes slightly for a pleasant effect
        const startTime = now + index * 0.08;
        const duration = 0.3;

        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      });
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  }, [settings.soundEnabled]);

  return { playNotificationSound };
}
