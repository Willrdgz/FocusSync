import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useFocusTimer } from '../../hooks/useFocusTimer';
import { finishFocusSession, insertDistraction, startFocusSession } from '../../lib/service';
import { colors, spacing, borderRadius, typography, fontWeights, shadows } from '../../constants/theme';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { TimerDisplay } from '../../components/focus/TimerDisplay';
import { SensorBadge } from '../../components/focus/SensorBadge';
import { InstructionText } from '../../components/focus/InstructionText';
import { MockIoTButton } from '../../components/focus/MockIoTButton';
import { Modal } from '../../components/ui/Modal';

const INITIAL_DURATION = 45 * 60;

export default function FocusScreen() {
  const [showGiveUpModal, setShowGiveUpModal] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const activeSessionIdRef = useRef<string | null>(null);
  const sessionEndedRef = useRef(false);
  const startedAtRef = useRef(0);

  const handleSessionEnd = (
    info: { plannedDuration: number; completedDuration: number; interruptions: number },
    status: 'completed' | 'interrupted'
  ) => {
    const id = activeSessionIdRef.current;
    if (!id) return;
    sessionEndedRef.current = true;
    finishFocusSession(id, { realMinutes: info.completedDuration, status }).catch(() => {
      // Si falla la carga no interrumpimos al usuario, la sesión simplemente no se registra
    });
  };

  const handleSessionComplete = (info: { plannedDuration: number; completedDuration: number; interruptions: number }) => {
    handleSessionEnd(info, 'completed');
  };

  const handleSessionStop = (info: { plannedDuration: number; completedDuration: number; interruptions: number }) => {
    handleSessionEnd(info, 'interrupted');
  };

  const {
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
  } = useFocusTimer({ onComplete: handleSessionComplete, onStop: handleSessionStop });

  const startNewSession = () => {
    startTimer(INITIAL_DURATION);
    startedAtRef.current = Date.now();
    startFocusSession(Math.round(INITIAL_DURATION / 60))
      .then(({ id }) => {
        activeSessionIdRef.current = id;
      })
      .catch(() => {
        activeSessionIdRef.current = null;
      });
  };

  useEffect(() => {
    if (!sessionStarted) {
      startNewSession();
      setSessionStarted(true);
    }
  }, []);

  useEffect(
    () => () => {
      const id = activeSessionIdRef.current;
      if (id && !sessionEndedRef.current) {
        const elapsedMinutes = Math.max(0, Math.round((Date.now() - startedAtRef.current) / 60000));
        finishFocusSession(id, { realMinutes: elapsedMinutes, status: 'interrupted' }).catch(() => {});
      }
    },
    []
  );

  const handleGiveUp = () => {
    setShowGiveUpModal(true);
  };

  const confirmGiveUp = () => {
    stopTimer();
    setShowGiveUpModal(false);
    router.back();
  };

  const handleDistraction = () => {
    if (!isRunning || isPaused) return;
    simulateDistraction();
    const id = activeSessionIdRef.current;
    if (id) {
      insertDistraction(id, 'dispositivo_levantado').catch(() => {});
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back-outline" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Modo Enfoque</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.timerContainer}>
          <TimerDisplay timeRemaining={timeRemaining} style={distractionDetected && styles.timerAlert} />
        </View>

        <InstructionText visible={sensorsActive && isRunning && !isPaused && !distractionDetected} />

        <View style={styles.sensorContainer}>
          <SensorBadge
            active={sensorsActive && isRunning && !distractionDetected}
            label={distractionDetected ? 'Dispositivo levantado' : undefined}
          />
        </View>

        {distractionDetected && (
          <Card style={styles.distractionCard}>
            <View style={styles.distractionIcon}>
              <Ionicons name="alert-circle-outline" size={30} color={colors.danger} />
            </View>
            <Text style={styles.distractionTitle}>¡Distracción Detectada!</Text>
            <Text style={styles.distractionMessage}>
              El giroscopio detectó movimiento. El temporizador ha sido pausado de forma automática. Vuelve a colocar el dispositivo boca abajo para reanudar la sesión.
            </Text>
            <View style={styles.distractionActions}>
              <Button title="Reanudar manualmente" onPress={clearDistraction} style={styles.distractionButton} />
              <Button title="Terminar sesión" variant="secondary" onPress={confirmGiveUp} style={styles.distractionButton} />
            </View>
          </Card>
        )}

        <View style={[styles.buttonContainer, distractionDetected && styles.hiddenControls]}>
          {isRunning && !isPaused && (
            <Button
              variant="secondary"
              title="Pausar"
              onPress={pauseTimer}
              style={styles.controlButton}
              leftIcon={<Ionicons name="pause-outline" size={20} color={colors.textPrimary} />}
            />
          )}
          {(isPaused || !sessionStarted) && (
            <Button
              variant="primary"
              title={sessionStarted ? 'Reanudar' : 'Iniciar'}
              onPress={sessionStarted ? resumeTimer : () => { startNewSession(); setSessionStarted(true); }}
              style={styles.controlButton}
              leftIcon={<Ionicons name={sessionStarted ? 'play-outline' : 'play-sharp'} size={20} color={colors.white} />}
            />
          )}
        </View>

        <View style={styles.giveUpContainer}>
          <Button
            variant="danger"
            title="Rendirse / Pausar sesión"
            onPress={handleGiveUp}
            style={styles.giveUpButton}
            leftIcon={<Ionicons name="stop-circle-outline" size={20} color={colors.white} />}
          />
        </View>
      </View>

      <MockIoTButton onDistraction={handleDistraction} style={styles.mockButton} />

      <Modal
        visible={showGiveUpModal}
        title="¿Rendirse?"
        message="Perderás el progreso de esta sesión. ¿Estás seguro?"
        onConfirm={confirmGiveUp}
        onCancel={() => setShowGiveUpModal(false)}
        confirmText="Sí, rendirme"
        cancelText="Continuar"
        danger
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    ...typography.xl,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xl,
  },
  timerContainer: {
    paddingVertical: spacing.xl,
  },
  timerAlert: {
    color: colors.danger,
    opacity: 0.72,
  },
  sensorContainer: {
    paddingHorizontal: spacing.lg,
  },
  buttonContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  controlButton: {
    minWidth: 140,
  },
  hiddenControls: {
    display: 'none',
  },
  distractionCard: {
    width: '100%',
    borderWidth: 2,
    borderColor: colors.danger,
    backgroundColor: colors.danger + '12',
    gap: spacing.md,
  },
  distractionIcon: {
    alignItems: 'center',
  },
  distractionTitle: {
    ...typography.xl,
    fontWeight: fontWeights.bold,
    color: colors.danger,
    textAlign: 'center',
  },
  distractionMessage: {
    ...typography.md,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 24,
  },
  distractionActions: {
    gap: spacing.sm,
  },
  distractionButton: {
    width: '100%',
  },
  giveUpContainer: {
    width: '100%',
    marginTop: spacing.md,
  },
  giveUpButton: {},
  mockButton: {},
});
