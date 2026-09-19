import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { InstructionText } from '../../../components/focus/InstructionText';
import { SensorBadge } from '../../../components/focus/SensorBadge';
import { TimerDisplay } from '../../../components/focus/TimerDisplay';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Modal } from '../../../components/ui/Modal';
import { borderRadius, colors, fontWeights, spacing, typography } from '../../../constants/theme';
import { useDeviceOrientation } from '../../../hooks/useDeviceOrientation';
import { useFocusTimer } from '../../../hooks/useFocusTimer';
import { cancelFocusSession, createFocusSession, recordDistraction, resumeFocusSession } from '../../../services/studyPlans';

export default function FocusScreen() {
  const { planId, blockId, durationMinutes } = useLocalSearchParams<{
    planId?: string;
    blockId?: string;
    durationMinutes?: string;
  }>();
  const plannedMinutes = Number(durationMinutes) > 0 ? Number(durationMinutes) : 45;
  const initialDuration = plannedMinutes * 60;
  const {
    timeRemaining,
    isRunning,
    isPaused,
    distractionDetected,
    waitingForFaceDown,
    prepareTimer,
    startTimer,
    activateTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    simulateDistraction,
    clearDistraction,
  } = useFocusTimer();
  const sensors = useDeviceOrientation(true);
  const [showGiveUpModal, setShowGiveUpModal] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [focusSessionId, setFocusSessionId] = useState<string | null>(null);
  const [savingSession, setSavingSession] = useState(false);
  const [pendingResumeSync, setPendingResumeSync] = useState(false);
  const distractionHandled = useRef(false);

  useEffect(() => {
    prepareTimer(initialDuration);
    setSessionStarted(false);
    setFocusSessionId(null);
  }, [blockId, initialDuration, planId, prepareTimer]);

  useEffect(() => {
    if (!waitingForFaceDown || !sensors.isFaceDown) return;

    activateTimer();
    distractionHandled.current = false;

    if (!sessionStarted) {
      setSessionStarted(true);
      setSavingSession(true);
      createFocusSession({ planId, blockId, plannedMinutes })
        .then(setFocusSessionId)
        .catch((error) => {
          Alert.alert('Sesión local activa', error instanceof Error ? error.message : 'No se pudo guardar la sesión.');
        })
        .finally(() => setSavingSession(false));
    } else if (pendingResumeSync) {
      setPendingResumeSync(false);
      if (focusSessionId) {
        resumeFocusSession(focusSessionId).catch(() => undefined);
      }
    }
  }, [activateTimer, blockId, focusSessionId, pendingResumeSync, planId, plannedMinutes, sensors.isFaceDown, sessionStarted, waitingForFaceDown]);

  useEffect(() => {
    if (!sessionStarted || !isRunning || isPaused || sensors.isFaceDown || distractionHandled.current) return;

    distractionHandled.current = true;
    simulateDistraction();

    if (focusSessionId) {
      recordDistraction({
        sessionId: focusSessionId,
        elapsedSeconds: initialDuration - timeRemaining,
        sensorPayload: {
          acceleration: sensors.snapshot.acceleration,
          rotation: sensors.snapshot.rotation,
          gyroscope_moving: sensors.isMoving,
        },
      }).catch(() => undefined);
    }
  }, [focusSessionId, initialDuration, isPaused, isRunning, sensors.isFaceDown, sensors.isMoving, sensors.snapshot, sessionStarted, simulateDistraction, timeRemaining]);

  const requestStart = () => startTimer(initialDuration);

  const requestResume = () => {
    setPendingResumeSync(true);
    distractionHandled.current = false;
    if (distractionDetected) clearDistraction();
    else resumeTimer();
  };

  const confirmGiveUp = async () => {
    if (focusSessionId) {
      try {
        await cancelFocusSession(focusSessionId, Math.floor((initialDuration - timeRemaining) / 60));
      } catch {
        // La sesión local puede finalizar aunque no haya conexión.
      }
    }
    stopTimer();
    setShowGiveUpModal(false);
    router.back();
  };

  const sensorLabel = sensors.available === null
    ? 'Comprobando sensores'
    : sensors.available === false
      ? 'Sensores no disponibles'
      : distractionDetected
        ? 'Dispositivo levantado'
        : waitingForFaceDown
          ? 'Esperando teléfono boca abajo'
          : isRunning && !isPaused && sensors.isFaceDown
            ? 'Boca abajo · cronómetro activo'
            : 'Sensores preparados';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} hitSlop={10}>
          <Ionicons name="chevron-back-outline" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Modo Enfoque</Text>
          <Text style={styles.blockDuration}>Bloque cargado: {plannedMinutes} min</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <TimerDisplay timeRemaining={timeRemaining} style={distractionDetected && styles.timerAlert} />

        <InstructionText
          visible={waitingForFaceDown || (isRunning && !isPaused)}
          text={waitingForFaceDown
            ? 'Coloca el teléfono boca abajo. El cronómetro comenzará cuando la posición sea estable.'
            : 'Mantén el teléfono boca abajo. Si lo levantas, la sesión se pausará automáticamente.'}
        />

        <View style={styles.sensorContainer}>
          <SensorBadge active={sensors.available === true && !distractionDetected} label={sensorLabel} />
          {sensors.isMoving && sensors.available && <Text style={styles.movementText}>Movimiento detectado por el giroscopio</Text>}
          {sensors.error && <Text style={styles.sensorError}>{sensors.error}</Text>}
        </View>

        {savingSession && <Text style={styles.syncText}>Guardando sesión en Supabase...</Text>}
        {focusSessionId && !savingSession && <Text style={styles.syncText}>Sesión sincronizada con Supabase</Text>}

        {distractionDetected && (
          <Card style={styles.distractionCard}>
            <Ionicons name="alert-circle-outline" size={30} color={colors.danger} />
            <Text style={styles.distractionTitle}>¡Distracción detectada!</Text>
            <Text style={styles.distractionMessage}>El teléfono fue levantado antes de finalizar el bloque y el cronómetro se pausó.</Text>
            <Button title="Preparar reanudación" onPress={requestResume} style={styles.fullButton} />
          </Card>
        )}

        {!distractionDetected && (
          <View style={styles.buttonContainer}>
            {!sessionStarted && !waitingForFaceDown && (
              <Button title="Iniciar bloque" onPress={requestStart} disabled={sensors.available !== true} style={styles.controlButton} leftIcon={<Ionicons name="play" size={20} color={colors.white} />} />
            )}
            {waitingForFaceDown && <Button title="Esperando posición..." onPress={() => undefined} disabled style={styles.controlButton} />}
            {isRunning && !isPaused && (
              <Button variant="secondary" title="Pausar manualmente" onPress={pauseTimer} style={styles.controlButton} leftIcon={<Ionicons name="pause" size={20} color={colors.textPrimary} />} />
            )}
            {sessionStarted && isPaused && !waitingForFaceDown && (
              <Button title="Reanudar" onPress={requestResume} style={styles.controlButton} leftIcon={<Ionicons name="play" size={20} color={colors.white} />} />
            )}
          </View>
        )}

        {sessionStarted && <Button variant="danger" title="Terminar sesión" onPress={() => setShowGiveUpModal(true)} style={styles.fullButton} />}
      </View>

      <Modal visible={showGiveUpModal} title="¿Terminar sesión?" message="Se guardará el tiempo estudiado hasta este momento." onConfirm={confirmGiveUp} onCancel={() => setShowGiveUpModal(false)} confirmText="Terminar" cancelText="Continuar" danger />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1, alignItems: 'center' },
  headerTitle: { ...typography.xl, fontWeight: fontWeights.bold, color: colors.textPrimary },
  blockDuration: { ...typography.xs, color: colors.textMuted },
  headerSpacer: { width: 44 },
  content: { flex: 1, paddingHorizontal: spacing.lg, justifyContent: 'center', alignItems: 'center', gap: spacing.lg },
  timerAlert: { color: colors.danger, opacity: 0.8 },
  sensorContainer: { alignItems: 'center', gap: spacing.sm },
  movementText: { ...typography.xs, color: colors.warning },
  sensorError: { ...typography.sm, color: colors.danger, textAlign: 'center' },
  syncText: { ...typography.xs, color: colors.textMuted, textAlign: 'center' },
  buttonContainer: { width: '100%', alignItems: 'center' },
  controlButton: { minWidth: 220 },
  fullButton: { width: '100%' },
  distractionCard: { width: '100%', alignItems: 'center', borderWidth: 2, borderColor: colors.danger, backgroundColor: colors.danger + '12', gap: spacing.md, borderRadius: borderRadius.lg },
  distractionTitle: { ...typography.xl, fontWeight: fontWeights.bold, color: colors.danger, textAlign: 'center' },
  distractionMessage: { ...typography.md, color: colors.textPrimary, textAlign: 'center', lineHeight: 24 },
});
