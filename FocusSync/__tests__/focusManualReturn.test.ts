import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import FocusScreen from '../features/focus/screens/FocusScreen';
import { createFocusSession, completeFocusSession, fetchStudyPlanById, recordDistraction } from '../services/studyPlans';

let mockFaceDown = true;

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ planId: 'plan', blockId: 'block', durationMinutes: '1' }),
  router: { back: jest.fn(), setParams: jest.fn() },
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('expo-keep-awake', () => ({ useKeepAwake: jest.fn() }));
jest.mock('react-native-safe-area-context', () => ({ SafeAreaView: require('react-native').View }));
jest.mock('../hooks/useDeviceOrientation', () => ({
  useDeviceOrientation: () => ({ available: true, isFaceDown: mockFaceDown, isMoving: false, snapshot: {} }),
}));
jest.mock('../hooks/useCompletionAlarm', () => ({
  useCompletionAlarm: () => ({ silence: jest.fn(), alarmError: null }),
}));
jest.mock('../services/completionNotification', () => ({
  prepareCompletionNotification: jest.fn().mockResolvedValue(true), isExpoGo: () => true,
}));
jest.mock('../services/studyPlans', () => ({
  fetchStudyPlanById: jest.fn().mockResolvedValue({ blocks: [{ id: 'block', title: 'Teoría', type: 'teoria', durationMinutes: 1 }] }),
  createFocusSession: jest.fn().mockResolvedValue('session'),
  completeFocusSession: jest.fn().mockResolvedValue(undefined),
  cancelFocusSession: jest.fn().mockResolvedValue(undefined),
  recordDistraction: jest.fn().mockResolvedValue(undefined), resumeFocusSession: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../components/focus/MinuteWheel', () => ({
  MinuteWheel: ({ onChange }: { onChange: (value: number) => void }) =>
    require('react').createElement(require('react-native').Text, { onPress: () => onChange(3) }, 'Elegir 3 minutos'),
}));

it('shows manual configuration immediately after a Coach block and starts the next session without block IDs', async () => {
  jest.useFakeTimers();
  try {
    const screen = render(React.createElement(FocusScreen));
    await act(async () => {});
    await act(async () => { fireEvent.press(screen.getByText('Iniciar')); });
    expect(createFocusSession).toHaveBeenCalledWith({ planId: 'plan', blockId: 'block', plannedMinutes: 1 });
    for (let second = 0; second < 60; second++) {
      act(() => { jest.advanceTimersByTime(1000); });
    }
    await act(async () => {});
    expect(screen.getByText('¡Felicidades! Terminaste todo tu estudio.')).toBeTruthy();
    expect(completeFocusSession).toHaveBeenCalledWith('session', 1);
    fireEvent.press(screen.getByText('Finalizar'));
    await act(async () => {});
    expect(screen.getByText('Configura tu tiempo')).toBeTruthy();
    fireEvent.press(screen.getByText('Elegir 3 minutos'));
    await act(async () => { fireEvent.press(screen.getByText('Iniciar')); });
    expect(createFocusSession).toHaveBeenLastCalledWith({ planId: undefined, blockId: undefined, plannedMinutes: 3 });
    screen.unmount();
  } finally {
    jest.useRealTimers();
  }
}, 20000);



it('continues through rest and later blocks, then returns to manual mode', async () => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  mockFaceDown = true;
  (fetchStudyPlanById as jest.Mock).mockResolvedValueOnce({ blocks: [
    { id: 'block', title: 'Teoría', type: 'teoria', durationMinutes: 1 },
    { id: 'rest', title: 'Pausa', type: 'descanso', durationMinutes: 1 },
    { id: 'practice', title: 'Ejercicios', type: 'practica', durationMinutes: 1 },
  ] });
  let sessionNumber = 0;
  (createFocusSession as jest.Mock).mockImplementation(async () => `session-${++sessionNumber}`);
  const screen = render(React.createElement(FocusScreen));
  const finishMinute = async () => {
    for (let i = 0; i < 60; i++) act(() => { jest.advanceTimersByTime(1000); });
    await act(async () => {});
  };
  try {
    await act(async () => {});
    await act(async () => { fireEvent.press(screen.getByText('Iniciar')); });
    for (let interruption = 0; interruption < 2; interruption++) {
      mockFaceDown = false;
      screen.rerender(React.createElement(FocusScreen));
      await act(async () => {});
      fireEvent.press(screen.getByText('Preparar reanudación'));
      mockFaceDown = true;
      screen.rerender(React.createElement(FocusScreen));
      await act(async () => {});
    }
    await finishMinute();
    expect(screen.getByText('¡Felicidades! Completaste tu bloque de estudio.')).toBeTruthy();
    expect(screen.getByText('Se detectaron 2 interrupciones, pero retomaste y completaste tu objetivo. ¡Buen trabajo!')).toBeTruthy();
    expect(screen.queryByText('Configura tu tiempo')).toBeNull();
    mockFaceDown = false;
    await act(async () => { fireEvent.press(screen.getByText('Continuar con descanso')); });
    expect(createFocusSession).toHaveBeenLastCalledWith({ planId: 'plan', blockId: 'rest', plannedMinutes: 1 });
    await finishMinute();
    expect(recordDistraction).toHaveBeenCalledTimes(2);
    expect(screen.getByText('¡Descanso completado!')).toBeTruthy();
    expect(screen.queryByText(/Excelente concentración/)).toBeNull();
    expect(completeFocusSession).toHaveBeenLastCalledWith('session-2', 1);
    await act(async () => { fireEvent.press(screen.getByText('Continuar con siguiente bloque')); });
    expect(createFocusSession).toHaveBeenCalledTimes(2);
    expect(screen.getByText('Esperando posición...')).toBeTruthy();
    mockFaceDown = true;
    screen.rerender(React.createElement(FocusScreen));
    await act(async () => {});
    expect(createFocusSession).toHaveBeenLastCalledWith({ planId: 'plan', blockId: 'practice', plannedMinutes: 1 });
    await finishMinute();
    expect(completeFocusSession).toHaveBeenCalledTimes(3);
    expect(screen.getByText('¡Felicidades! Terminaste todo tu estudio.')).toBeTruthy();
    expect(screen.getByText('Se detectaron 2 interrupciones, pero retomaste el plan y cumpliste tu objetivo. ¡Buen trabajo!')).toBeTruthy();
    fireEvent.press(screen.getByText('Finalizar'));
    expect(screen.getByText('Configura tu tiempo')).toBeTruthy();
  } finally {
    screen.unmount();
    jest.useRealTimers();
    mockFaceDown = true;
  }
}, 20000);
