import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import FocusScreen from '../features/focus/screens/FocusScreen';
import { createFocusSession, completeFocusSession } from '../services/studyPlans';

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ planId: 'plan', blockId: 'block', durationMinutes: '1' }),
  router: { back: jest.fn(), setParams: jest.fn() },
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('expo-keep-awake', () => ({ useKeepAwake: jest.fn() }));
jest.mock('react-native-safe-area-context', () => ({ SafeAreaView: require('react-native').View }));
jest.mock('../hooks/useDeviceOrientation', () => ({
  useDeviceOrientation: () => ({ available: true, isFaceDown: true, isMoving: false, snapshot: {} }),
}));
jest.mock('../hooks/useCompletionAlarm', () => ({
  useCompletionAlarm: () => ({ silence: jest.fn(), alarmError: null }),
}));
jest.mock('../services/completionNotification', () => ({
  prepareCompletionNotification: jest.fn().mockResolvedValue(true), isExpoGo: () => true,
}));
jest.mock('../services/studyPlans', () => ({
  createFocusSession: jest.fn().mockResolvedValue('session'),
  completeFocusSession: jest.fn().mockResolvedValue(undefined),
  cancelFocusSession: jest.fn().mockResolvedValue(undefined),
  recordDistraction: jest.fn(), resumeFocusSession: jest.fn(),
}));
jest.mock('../components/focus/MinuteWheel', () => ({
  MinuteWheel: ({ onChange }: { onChange: (value: number) => void }) =>
    require('react').createElement(require('react-native').Text, { onPress: () => onChange(3) }, 'Elegir 3 minutos'),
}));

it('shows manual configuration immediately after a Coach block and starts the next session without block IDs', async () => {
  jest.useFakeTimers();
  try {
    const screen = render(React.createElement(FocusScreen));
    await act(async () => { fireEvent.press(screen.getByText('Iniciar')); });
    expect(createFocusSession).toHaveBeenCalledWith({ planId: 'plan', blockId: 'block', plannedMinutes: 1 });
    for (let second = 0; second < 60; second++) {
      act(() => { jest.advanceTimersByTime(1000); });
    }
    await act(async () => {});
    expect(screen.getByText('Configura tu tiempo')).toBeTruthy();
    expect(completeFocusSession).toHaveBeenCalledWith('session', 1);
    fireEvent.press(screen.getByText('Elegir 3 minutos'));
    expect(screen.getByText('Completaste 1 minutos de enfoque.')).toBeTruthy();
    fireEvent.press(screen.getByText('Finalizar'));
    await act(async () => {});
    expect(screen.getByText('Configura tu tiempo')).toBeTruthy();
    await act(async () => { fireEvent.press(screen.getByText('Iniciar')); });
    expect(createFocusSession).toHaveBeenLastCalledWith({ planId: undefined, blockId: undefined, plannedMinutes: 3 });
    screen.unmount();
  } finally {
    jest.useRealTimers();
  }
});


