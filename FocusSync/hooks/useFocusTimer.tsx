import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';

interface UseFocusTimerReturn {
  timeRemaining: number;
  isRunning: boolean;
  isPaused: boolean;
  sensorsActive: boolean;
  distractionDetected: boolean;
  startTimer: (duration: number) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => void;
  simulateDistraction: () => void;
  clearDistraction: () => void;
  toggleSensors: () => void;
}

export function useFocusTimer(): UseFocusTimerReturn {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [sensorsActive, setSensorsActive] = useState(true);
  const [distractionDetected, setDistractionDetected] = useState(false);
  const [initialDuration, setInitialDuration] = useState(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isRunning && !isPaused && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsPaused(false);
            Alert.alert('¡Sesión completada!', 'Has completado tu bloque de estudio.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, isPaused, timeRemaining]);

  const startTimer = useCallback((duration: number) => {
    setInitialDuration(duration);
    setTimeRemaining(duration);
    setIsRunning(true);
    setIsPaused(false);
    setDistractionDetected(false);
  }, []);

  const pauseTimer = useCallback(() => {
    setIsPaused(true);
  }, []);

  const resumeTimer = useCallback(() => {
    setIsPaused(false);
  }, []);

  const stopTimer = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
    setDistractionDetected(false);
    setTimeRemaining(0);
  }, []);

  const simulateDistraction = useCallback(() => {
    if (isRunning && !isPaused) {
      setIsPaused(true);
      setDistractionDetected(true);
    }
  }, [isRunning, isPaused]);

  const clearDistraction = useCallback(() => {
    setDistractionDetected(false);
    setIsPaused(false);
  }, []);

  const toggleSensors = useCallback(() => {
    setSensorsActive((prev) => !prev);
  }, []);

  return {
    timeRemaining,
    isRunning,
    isPaused,
    sensorsActive,
    distractionDetected,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    simulateDistraction,
    clearDistraction,
    toggleSensors,
  };
}
