import { act, renderHook } from '@testing-library/react-native';
import { Platform, Vibration } from 'react-native';
import { useCompletionAlarm } from '../hooks/useCompletionAlarm';
import { setAudioModeAsync } from 'expo-audio';

const mockPlayer = { pause: jest.fn(), play: jest.fn(), seekTo: jest.fn().mockResolvedValue(undefined), loop: false };
let mockLoaded = true;
jest.mock('expo-audio', () => ({
  useAudioPlayer: () => mockPlayer,
  useAudioPlayerStatus: () => ({ isLoaded: mockLoaded }),
  setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../services/completionNotification', () => ({
  showCompletionNotification: jest.fn().mockResolvedValue('accepted-but-not-necessarily-audible'),
  dismissCompletionNotification: jest.fn().mockResolvedValue(undefined),
}));

describe('completion alarm', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockLoaded = true;
    jest.spyOn(Vibration, 'vibrate').mockImplementation(() => undefined);
    jest.spyOn(Vibration, 'cancel').mockImplementation(() => undefined);
  });

  it('still plays local audio when Android accepts a silent notification', async () => {
    const originalOS = Platform.OS;
    Platform.OS = 'android';
    try {
      const { unmount } = renderHook(() => useCompletionAlarm(true));
      await act(async () => undefined);
      expect(mockPlayer.play).toHaveBeenCalledTimes(1);
      expect(Vibration.vibrate).toHaveBeenCalled();
      unmount();
    } finally { Platform.OS = originalOS; }
  });

  it('waits for the sound to load while vibration starts immediately', async () => {
    mockLoaded = false;
    const { rerender, unmount } = renderHook(() => useCompletionAlarm(true));
    expect(mockPlayer.play).not.toHaveBeenCalled();
    expect(Vibration.vibrate).toHaveBeenCalledTimes(1);
    mockLoaded = true;
    await act(async () => rerender({}));
    expect(mockPlayer.play).toHaveBeenCalledTimes(1);
    unmount();
  });
  afterEach(() => { jest.restoreAllMocks(); jest.useRealTimers(); });

  it('plays and vibrates only on completion, then silences and can play for a new session', async () => {
    const { result, rerender, unmount } = renderHook<ReturnType<typeof useCompletionAlarm>, { completed: boolean }>(({ completed }) => useCompletionAlarm(completed), { initialProps: { completed: false } });
    expect(mockPlayer.play).not.toHaveBeenCalled();
    await act(async () => rerender({ completed: true }));
    expect(mockPlayer.play).toHaveBeenCalledTimes(1);
    expect(Vibration.vibrate).toHaveBeenCalledTimes(1);
    act(() => result.current.silence());
    expect(mockPlayer.pause).toHaveBeenCalled();
    expect(Vibration.cancel).toHaveBeenCalled();
    await act(async () => rerender({ completed: false }));
    await act(async () => rerender({ completed: true }));
    expect(mockPlayer.play).toHaveBeenCalledTimes(2);
    act(() => jest.advanceTimersByTime(30000));
    const callsAfterTimeout = (Vibration.vibrate as jest.Mock).mock.calls.length;
    act(() => jest.advanceTimersByTime(5000));
    expect(Vibration.vibrate).toHaveBeenCalledTimes(callsAfterTimeout);
    unmount();
  });

  it('keeps issuing vibration pulses when audio fails, and stops on silence', async () => {
    (setAudioModeAsync as jest.Mock).mockRejectedValueOnce(new Error('Audio unavailable'));
    const { result, unmount } = renderHook(() => useCompletionAlarm(true));
    await act(async () => undefined);
    expect(result.current.alarmError).toBeTruthy();
    expect(Vibration.vibrate).toHaveBeenCalledWith(1000);
    act(() => jest.advanceTimersByTime(3600));
    expect(Vibration.vibrate).toHaveBeenCalledTimes(3);
    act(() => result.current.silence());
    act(() => jest.advanceTimersByTime(3600));
    expect(Vibration.vibrate).toHaveBeenCalledTimes(3);
    unmount();
  });
});
