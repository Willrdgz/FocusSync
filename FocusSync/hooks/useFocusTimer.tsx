import { useState, useEffect, useCallback } from 'react';

interface UseFocusTimerReturn {
  timeRemaining: number;
  isRunning: boolean;
  isPaused: boolean;
  distractionDetected: boolean;
  waitingForFaceDown: boolean;
  isCompleted: boolean;
  prepareTimer: (duration: number) => void;
  startTimer: (duration: number) => void;
  activateTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => void;
  simulateDistraction: () => void;
  clearDistraction: () => void;
}

export function useFocusTimer(): UseFocusTimerReturn {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [distractionDetected, setDistractionDetected] = useState(false);
  const [waitingForFaceDown, setWaitingForFaceDown] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isRunning && !isPaused && !waitingForFaceDown && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => Math.max(0, prev - 1));
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, isPaused, timeRemaining, waitingForFaceDown]);

  useEffect(() => {
    if (isRunning && !isPaused && timeRemaining === 0) {
      setIsRunning(false);
      setIsCompleted(true);
    }
  }, [isRunning, isPaused, timeRemaining]);

  const prepareTimer = useCallback((duration: number) => {
    setIsCompleted(false);
    setTimeRemaining(duration);
    setIsRunning(false);
    setIsPaused(false);
    setWaitingForFaceDown(false);
    setDistractionDetected(false);
  }, []);

  const startTimer = useCallback((duration: number) => {
    setIsCompleted(false);
    setTimeRemaining((current) => current || duration);
    setWaitingForFaceDown(true);
    setIsPaused(false);
    setDistractionDetected(false);
  }, []);

  const activateTimer = useCallback(() => {
    setIsRunning(true);
    setIsPaused(false);
    setWaitingForFaceDown(false);
  }, []);

  const pauseTimer = useCallback(() => {
    setIsPaused(true);
    setWaitingForFaceDown(false);
  }, []);

  const resumeTimer = useCallback(() => {
    setWaitingForFaceDown(true);
  }, []);

  const stopTimer = useCallback(() => {
    setIsCompleted(false);
    setIsRunning(false);
    setIsPaused(false);
    setDistractionDetected(false);
    setWaitingForFaceDown(false);
    setTimeRemaining(0);
  }, []);

  const simulateDistraction = useCallback(() => {
    if (isRunning && !isPaused) {
      setIsPaused(true);
      setDistractionDetected(true);
      setWaitingForFaceDown(false);
    }
  }, [isRunning, isPaused]);

  const clearDistraction = useCallback(() => {
    setDistractionDetected(false);
    setWaitingForFaceDown(true);
  }, []);

  return {
    timeRemaining,
    isRunning,
    isPaused,
    distractionDetected,
    waitingForFaceDown,
    isCompleted,
    prepareTimer,
    startTimer,
    activateTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    simulateDistraction,
    clearDistraction,
  };
}
