import { act, renderHook } from '@testing-library/react-native';
import { useFocusTimer } from '../hooks/useFocusTimer';

describe('focus timer lifecycle', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('waits for face down and completes only after running the full duration', () => {
    const { result } = renderHook(() => useFocusTimer());
    act(() => { result.current.prepareTimer(2); result.current.startTimer(2); });
    act(() => jest.advanceTimersByTime(3000));
    expect(result.current.timeRemaining).toBe(2);
    act(() => result.current.activateTimer());
    act(() => jest.advanceTimersByTime(1000));
    expect(result.current.isCompleted).toBe(false);
    act(() => jest.advanceTimersByTime(1000));
    expect(result.current.isCompleted).toBe(true);
    expect(result.current.isRunning).toBe(false);
  });

  it('does not count during pause or waiting to resume and cancellation is not completion', () => {
    const { result } = renderHook(() => useFocusTimer());
    act(() => { result.current.prepareTimer(60); result.current.activateTimer(); });
    act(() => jest.advanceTimersByTime(1000));
    act(() => result.current.simulateDistraction());
    act(() => jest.advanceTimersByTime(5000));
    expect(result.current.timeRemaining).toBe(59);
    act(() => result.current.clearDistraction());
    act(() => jest.advanceTimersByTime(5000));
    expect(result.current.timeRemaining).toBe(59);
    act(() => result.current.stopTimer());
    expect(result.current.isCompleted).toBe(false);
    act(() => result.current.prepareTimer(120));
    expect(result.current.timeRemaining).toBe(120);
    expect(result.current.isCompleted).toBe(false);
  });
});
