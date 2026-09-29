import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

export const isExpoGo = () => Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

const CHANNEL_ID = 'focussync-completion-alarm-v1';

export async function prepareCompletionNotification(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  // The package entry point initializes its push token emitter on import.
  // Avoid importing it in Expo Go, even when only local notifications are used.
  if (isExpoGo()) return false;
  const notifications: typeof import('expo-notifications') = require('expo-notifications');
  await notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Alarma al completar una sesión',
    importance: notifications.AndroidImportance.HIGH,
    sound: 'default',
    audioAttributes: {
      usage: notifications.AndroidAudioUsage.ALARM,
      contentType: notifications.AndroidAudioContentType.SONIFICATION,
    },
    enableVibrate: true,
    vibrationPattern: [0, 1000, 500, 1000, 500, 1000],
    bypassDnd: false,
  });
  notifications.setNotificationHandler({
    handleNotification: async (notification) => ({
      shouldPlaySound: notification.request.content.data?.focusCompletion === true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
  const permission = await notifications.getPermissionsAsync();
  if (permission.granted) return true;
  return (await notifications.requestPermissionsAsync()).granted;
}

export async function showCompletionNotification(): Promise<string | null> {
  if (Platform.OS !== 'android' || isExpoGo()) return null;
  const notifications: typeof import('expo-notifications') = require('expo-notifications');
  if (!(await notifications.getPermissionsAsync()).granted) return null;
  return notifications.scheduleNotificationAsync({
    content: {
      title: '¡Sesión completada!',
      body: 'Tu tiempo de enfoque terminó.',
      sound: 'default',
      data: { focusCompletion: true },
    },
    trigger: { channelId: CHANNEL_ID },
  });
}

export async function dismissCompletionNotification(id: string): Promise<void> {
  if (Platform.OS !== 'android' || isExpoGo()) return;
  const notifications: typeof import('expo-notifications') = require('expo-notifications');
  await notifications.cancelScheduledNotificationAsync(id);
  await notifications.dismissNotificationAsync(id);
}

