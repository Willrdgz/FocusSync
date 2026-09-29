import { Platform } from 'react-native';
import { dismissCompletionNotification, prepareCompletionNotification, showCompletionNotification } from '../services/completionNotification';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { executionEnvironment: 'bare' },
  ExecutionEnvironment: { StoreClient: 'storeClient' },
}));

jest.mock('expo-notifications', () => ({
  AndroidImportance: { HIGH: 4 },
  AndroidAudioUsage: { ALARM: 4 },
  AndroidAudioContentType: { SONIFICATION: 4 },
  setNotificationChannelAsync: jest.fn().mockResolvedValue(undefined),
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn().mockResolvedValue('completion-id'),
  cancelScheduledNotificationAsync: jest.fn(),
  dismissNotificationAsync: jest.fn(),
}));

describe('Android completion notification', () => {
  const originalOS = Platform.OS;
  beforeEach(() => { Platform.OS = 'android'; Object.assign(Constants, { executionEnvironment: 'bare' }); jest.clearAllMocks(); });
  afterEach(() => { Platform.OS = originalOS; });
  it('skips every notification operation in Expo Go', async () => {
    Object.assign(Constants, { executionEnvironment: 'storeClient' });
    expect(await prepareCompletionNotification()).toBe(false);
    expect(await showCompletionNotification()).toBeNull();
    await dismissCompletionNotification('old-id');
    expect(Notifications.setNotificationChannelAsync).not.toHaveBeenCalled();
    expect(Notifications.getPermissionsAsync).not.toHaveBeenCalled();
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    expect(Notifications.cancelScheduledNotificationAsync).not.toHaveBeenCalled();
    expect(Notifications.dismissNotificationAsync).not.toHaveBeenCalled();
  });
  it('uses alarm audio attributes and requests permission before a session', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ granted: false });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ granted: true });
    expect(await prepareCompletionNotification()).toBe(true);
    expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
      audioAttributes: { usage: 4, contentType: 4 }, enableVibrate: true, bypassDnd: false,
    }));
    expect(Notifications.requestPermissionsAsync).toHaveBeenCalledTimes(1);
  });
  it('does not send an alarm without permission', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ granted: false });
    expect(await showCompletionNotification()).toBeNull();
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });
  it('sends completion through the alarm channel', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ granted: true });
    expect(await showCompletionNotification()).toBe('completion-id');
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(expect.objectContaining({ trigger: { channelId: 'focussync-completion-alarm-v1' } }));
  });
});
