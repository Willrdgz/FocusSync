import { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";

//Agregamos una interfaz para la información de la sesión de enfoque
interface FocusSessionInfo {
  plannedDuration: number;
  completedDuration: number;
  interruptions: number;
}
//Agregamos una interfaz para las opciones del hook permitiendo que puedan decirme cuando la sesión termino o cuando se detuvo
interface UseFocusTimerOptions {
  onComplete?: (info: FocusSessionInfo) => void;
  onStop?: (info: FocusSessionInfo) => void;
}

interface UseFocusTimerReturn {
  timeRemaining: number;
  isRunning: boolean;
  isPaused: boolean;
  sensorsActive: boolean;
  distractionDetected: boolean;
  interruptions: number;
  startTimer: (duration: number) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => void;
  simulateDistraction: () => void;
  clearDistraction: () => void;
  toggleSensors: () => void;
}

export function useFocusTimer(
  options?: UseFocusTimerOptions,
): UseFocusTimerReturn {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [sensorsActive, setSensorsActive] = useState(true);
  const [distractionDetected, setDistractionDetected] = useState(false);
  const [initialDuration, setInitialDuration] = useState(0);
  const [interruptions, setInterruptions] = useState(0);

  // Guardamos las opciones en un ref para que siempre tengamos la versión más reciente
  const optionsRef = useRef(options);
  optionsRef.current = options;
  //Modificando el efecto del temporizadory pueda funcionar en la sesión de enfoque y leer la información en la BD
  useEffect(() => {
    if (!isRunning || isPaused || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, isPaused, timeRemaining]);

  useEffect(() => {
    if (!isRunning || isPaused || timeRemaining !== 0 || initialDuration <= 0)
      return;

    setIsRunning(false);
    setIsPaused(false);
    setDistractionDetected(false);
    const info: FocusSessionInfo = {
      plannedDuration: Math.round(initialDuration / 60),
      completedDuration: Math.round(initialDuration / 60),
      interruptions,
    };
    Alert.alert("¡Sesión completada!", "Has completado tu bloque de estudio.");
    optionsRef.current?.onComplete?.(info);
  }, [isRunning, isPaused, timeRemaining, initialDuration, interruptions]);

  const startTimer = useCallback((duration: number) => {
    setInitialDuration(duration);
    setTimeRemaining(duration);
    setIsRunning(true);
    setIsPaused(false);
    setDistractionDetected(false);
    setInterruptions(0);
  }, []);

  const pauseTimer = useCallback(() => {
    setIsPaused(true);
  }, []);

  const resumeTimer = useCallback(() => {
    setIsPaused(false);
  }, []);

  const stopTimer = useCallback(() => {
    const completedSeconds = Math.max(0, initialDuration - timeRemaining);
    setIsRunning(false);
    setIsPaused(false);
    setDistractionDetected(false);
    setTimeRemaining(0);
    optionsRef.current?.onStop?.({
      plannedDuration: Math.round(initialDuration / 60),
      completedDuration: Math.round(completedSeconds / 60),
      interruptions,
    });
  }, [initialDuration, timeRemaining, interruptions]);

  const simulateDistraction = useCallback(() => {
    if (isRunning && !isPaused) {
      setIsPaused(true);
      setDistractionDetected(true);
      setInterruptions((prev) => prev + 1);
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
    interruptions,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    simulateDistraction,
    clearDistraction,
    toggleSensors,
  };
}
