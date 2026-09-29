import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Vibration } from 'react-native';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { dismissCompletionNotification, showCompletionNotification } from '../services/completionNotification';

export function useCompletionAlarm(completed: boolean) {
  const player = useAudioPlayer(require('../assets/sounds/completion.wav'));
  const { isLoaded } = useAudioPlayerStatus(player);
  const stopped = useRef(false);
  const [silenced, setSilenced] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const silence = useCallback(() => {
    stopped.current = true;
    setSilenced(true);
    Vibration.cancel();
    player.pause();
  }, [player]);

  useEffect(() => {
    if (!completed) {
      setSilenced(false);
      setError(null);
    }
  }, [completed]);

  // Keep vibration independent of audio loading, errors and player replacement.
  useEffect(() => {
    if (!completed || silenced) return;
    const pulse = () => Vibration.vibrate(1000);
    pulse();
    const interval = setInterval(pulse, 1800);
    const timeout = setTimeout(() => setSilenced(true), 30000);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
      Vibration.cancel();
    };
  }, [completed, silenced]);

  useEffect(() => {
    if (!completed || silenced) return;
    if (Platform.OS !== 'android') return;
    let cancelled = false;
    let notificationId: string | null = null;
    // Scheduling a notification is not proof that Android played its sound.
    // This channel must never suppress the independent in-app audio or vibration.
    void showCompletionNotification().then(async (id) => {
      notificationId = id;
      if (cancelled && id) await dismissCompletionNotification(id);
    }).catch(() => undefined);
    return () => {
      cancelled = true;
      if (notificationId) void dismissCompletionNotification(notificationId).catch(() => undefined);
    };
  }, [completed, silenced]);

  useEffect(() => {
    if (!completed || silenced || !isLoaded) return;
    stopped.current = false;
    let cancelled = false;
    void (async () => {
      try {
        await setAudioModeAsync({ playsInSilentMode: true });
        await player.seekTo(0);
        if (cancelled || stopped.current) return;
        player.loop = true;
        player.muted = false;
        player.volume = 1;
        player.play();
      } catch {
        if (!cancelled) setError('No se pudo reproducir el sonido. Revisa el volumen del teléfono.');
      }
    })();
    return () => {
      cancelled = true;
      player.pause();
    };
  }, [completed, player, silenced, isLoaded]);
  return { silence, alarmError: error, soundReady: isLoaded };
}
