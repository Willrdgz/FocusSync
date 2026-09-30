import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Modal as RNModal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';
import { SafeAreaView } from 'react-native-safe-area-context';

import { InstructionText } from '../../../components/focus/InstructionText';
import { SensorBadge } from '../../../components/focus/SensorBadge';
import { TimerDisplay } from '../../../components/focus/TimerDisplay';
import { MinuteWheel } from '../../../components/focus/MinuteWheel';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Modal } from '../../../components/ui/Modal';
import { borderRadius, colors, fontWeights, spacing, typography } from '../../../constants/theme';
import { useDeviceOrientation } from '../../../hooks/useDeviceOrientation';
import { useFocusTimer } from '../../../hooks/useFocusTimer';
import { useCompletionAlarm } from '../../../hooks/useCompletionAlarm';
import { isExpoGo, prepareCompletionNotification } from '../../../services/completionNotification';
import { cancelFocusSession, completeFocusSession, createFocusSession, fetchStudyPlanById, recordDistraction, resumeFocusSession } from '../../../services/studyPlans';

import { StudyPlanBlock } from '../../../types';

function KeepTimerAwake() {
  useKeepAwake();
  return null;
}

export default function FocusScreen() {
  const { planId, blockId: routeBlockId, durationMinutes } = useLocalSearchParams<{
    planId?: string;
    blockId?: string;
    durationMinutes?: string;
  }>();
  const [blockId, setBlockId] = useState(routeBlockId);
  const [blocks, setBlocks] = useState<StudyPlanBlock[]>([]);
  const [loadingPlan, setLoadingPlan] = useState(Boolean(planId));
  const [planError, setPlanError] = useState(false);
  const [planRetry, setPlanRetry] = useState(0);
  const [continuePending, setContinuePending] = useState(false);
  const [manualMinutes, setManualMinutes] = useState('25');
  const [manualMode, setManualMode] = useState(false);
  const fromBlock = Boolean(blockId) && !manualMode;
  const blockIndex = blocks.findIndex((block) => block.id === blockId);
  const currentBlock = fromBlock ? blocks[blockIndex] : undefined;
  const nextBlock = fromBlock && blockIndex >= 0 ? blocks[blockIndex + 1] : undefined;
  const isRest = currentBlock?.type === 'descanso';
  const validManualMinutes = /^\d+$/.test(manualMinutes) && Number(manualMinutes) >= 1 && Number(manualMinutes) <= 180;
  const plannedMinutes = fromBlock ? (currentBlock?.durationMinutes ?? (Number(durationMinutes) > 0 ? Number(durationMinutes) : 25)) : Number(manualMinutes);
  const initialDuration = plannedMinutes * 60;
  const {
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
    simulateDistraction,
    clearDistraction,
  } = useFocusTimer();
  const { silence, alarmError } = useCompletionAlarm(isCompleted);
  const sensors = useDeviceOrientation(true);
  const [showGiveUpModal, setShowGiveUpModal] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [focusSessionId, setFocusSessionId] = useState<string | null>(null);
  const [savingSession, setSavingSession] = useState(false);
  const [pendingResumeSync, setPendingResumeSync] = useState(false);
  const distractionHandled = useRef(false);
  const [interruptionCount, setInterruptionCount] = useState(0);
  const [planInterruptionCount, setPlanInterruptionCount] = useState(0);
  const completionHandled = useRef(false);
  const sessionMinutes = useRef(plannedMinutes);
  const [completionError, setCompletionError] = useState(false);
  const [preparingAlarm, setPreparingAlarm] = useState(false);
  const [alarmPermissionWarning, setAlarmPermissionWarning] = useState<string | null>(null);

  const completedRef = useRef(isCompleted);
  completedRef.current = isCompleted;
  useEffect(() => {
    setManualMode(false);
    setBlockId(routeBlockId);
    setBlocks([]);
    setPlanInterruptionCount(0);
    setContinuePending(false);
    setPlanError(false);
    if (!planId || !routeBlockId) { setLoadingPlan(false); return; }
    let active = true;
    setLoadingPlan(true);
    fetchStudyPlanById(planId).then((plan) => {
      if (!active) return;
      if (!plan.blocks.some((block) => block.id === routeBlockId)) throw new Error('Bloque no encontrado');
      setBlocks(plan.blocks);
    }).catch(() => { if (active) setPlanError(true); })
      .finally(() => { if (active) setLoadingPlan(false); });
    return () => { active = false; };
    // Retry reloads the same plan after a network failure.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeBlockId, planId, durationMinutes, planRetry]);

  useEffect(() => {
    // Keep the completed session intact while the next duration is being edited.
    if (completedRef.current) return;
    prepareTimer(initialDuration);
    setInterruptionCount(0);
    setSessionStarted(false);
    setFocusSessionId(null);
    completionHandled.current = false;
    setCompletionError(false);
  }, [blockId, initialDuration, planId, prepareTimer]);

  useEffect(() => {
    if (!waitingForFaceDown || (!isRest && !sensors.isFaceDown)) return;

    activateTimer();
    distractionHandled.current = false;

    if (!sessionStarted) {
      setSessionStarted(true);
      setSavingSession(true);
      createFocusSession({ planId: fromBlock ? planId : undefined, blockId: fromBlock ? blockId : undefined, plannedMinutes })
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
  }, [activateTimer, blockId, focusSessionId, fromBlock, isRest, pendingResumeSync, planId, plannedMinutes, sensors.isFaceDown, sessionStarted, waitingForFaceDown]);

  useEffect(() => {
    if (isRest || !sessionStarted || !isRunning || isPaused || sensors.isFaceDown || distractionHandled.current) return;

    distractionHandled.current = true;
    setInterruptionCount((count) => count + 1);
    if (fromBlock) setPlanInterruptionCount((count) => count + 1);
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
  }, [focusSessionId, fromBlock, initialDuration, isRest, isPaused, isRunning, sensors.isFaceDown, sensors.isMoving, sensors.snapshot, sessionStarted, simulateDistraction, timeRemaining]);

  useEffect(() => {
    if (!isCompleted || !focusSessionId || completionHandled.current) return;
    completionHandled.current = true;
    setSavingSession(true);
    completeFocusSession(focusSessionId, sessionMinutes.current).catch(() => {
      setCompletionError(true);
    }).finally(() => setSavingSession(false));
  }, [focusSessionId, plannedMinutes, isCompleted]);

  const requestStart = async () => {
    if (!fromBlock && !validManualMinutes) return;
    if (preparingAlarm || (fromBlock && (loadingPlan || planError))) return;
    sessionMinutes.current = plannedMinutes;
    setPreparingAlarm(true);
    try {
      const allowed = await prepareCompletionNotification();
      setAlarmPermissionWarning(allowed ? null : isExpoGo()
        ? 'En FocusSync el sonido usa el volumen multimedia. Mantén la app abierta.'
        : 'Permite las notificaciones para oír el aviso con el volumen de alarmas.');
      startTimer(initialDuration);
    } catch {
      setAlarmPermissionWarning('No se pudo preparar el aviso de Android. El sonido dependerá del volumen multimedia.');
      startTimer(initialDuration);
    } finally {
      setPreparingAlarm(false);
    }
  };

  const resetSession = () => {
    silence();
    setManualMode(true);
    prepareTimer(Number(manualMinutes) * 60);
    setInterruptionCount(0);
    setPlanInterruptionCount(0);
    setSessionStarted(false);
    setFocusSessionId(null);
    setPendingResumeSync(false);
    distractionHandled.current = false;
    completionHandled.current = false;
    setCompletionError(false);
    setAlarmPermissionWarning(null);
    router.setParams({ planId: undefined, blockId: undefined, durationMinutes: undefined });
  };

  const finishBlock = () => {
    if (savingSession || completionError || continuePending) return;
    if (!nextBlock) { resetSession(); return; }
    silence();
    setSessionStarted(false);
    setFocusSessionId(null);
    setPendingResumeSync(false);
    completionHandled.current = false;
    distractionHandled.current = false;
    setCompletionError(false);
    prepareTimer(nextBlock.durationMinutes * 60);
    setInterruptionCount(0);
    setBlockId(nextBlock.id);
    setContinuePending(true);
  };

  useEffect(() => {
    if (!continuePending) return;
    sessionMinutes.current = plannedMinutes;
    startTimer(initialDuration);
    setContinuePending(false);
  }, [continuePending, initialDuration, plannedMinutes, startTimer]);

  const requestResume = () => {
    setPendingResumeSync(true);
    distractionHandled.current = false;
    if (distractionDetected) clearDistraction();
    else resumeTimer();
  };

  const confirmGiveUp = async () => {
    if (focusSessionId && !isCompleted) {
      try {
        await cancelFocusSession(focusSessionId, Math.floor((initialDuration - timeRemaining) / 60));
      } catch {
        // La sesión local puede finalizar aunque no haya conexión.
      }
    }
    resetSession();
    setShowGiveUpModal(false);
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
  const isPlanFinished = fromBlock && !nextBlock;
  const displayedInterruptions = isPlanFinished ? planInterruptionCount : interruptionCount;

  return (
    <SafeAreaView style={styles.container}>
      {(isRunning || waitingForFaceDown) && <KeepTimerAwake />}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} hitSlop={10}>
          <Ionicons name="chevron-back-outline" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Modo Enfoque</Text>
          <Text style={styles.blockDuration}>{fromBlock ? (currentBlock ? `Bloque ${blockIndex + 1} de ${blocks.length}` : 'Plan de estudio') : 'Sesión manual'}: {plannedMinutes} min</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {fromBlock && loadingPlan && <Text style={styles.syncText}>Cargando bloques del plan...</Text>}
        {fromBlock && planError && <Button title="Reintentar cargar plan" onPress={() => setPlanRetry((value) => value + 1)} />}
        {currentBlock && <Text style={styles.distractionMessage}>{isRest ? 'Descanso' : currentBlock.title}</Text>}
        {!sessionStarted && !waitingForFaceDown && (
          <View style={styles.manualSettings}>
            {fromBlock && !isCompleted ? <Button title="Configurar sesión manual" variant="secondary" onPress={() => setManualMode(true)} /> : <>
              <Text style={styles.distractionMessage}>Configura tu tiempo</Text>
              <MinuteWheel value={Number(manualMinutes)} onChange={(minutes) => setManualMinutes(String(minutes))} disabled={preparingAlarm} />
              <Text style={styles.syncText}>Desliza las horas y los minutos. Elige entre 1 minuto y 3 horas.</Text>
            </>}
          </View>
        )}
        {!isCompleted && (fromBlock || sessionStarted || waitingForFaceDown) && <TimerDisplay timeRemaining={timeRemaining} style={distractionDetected && styles.timerAlert} />}

        <InstructionText
          visible={!isRest && (waitingForFaceDown || (isRunning && !isPaused))}
          text={waitingForFaceDown
            ? 'Coloca el teléfono boca abajo. El cronómetro comenzará cuando la posición sea estable.'
            : 'Mantén el teléfono boca abajo. Si lo levantas, la sesión se pausará automáticamente.'}
        />

        {isRest ? <Text style={styles.syncText}>Puedes levantar el teléfono durante el descanso.</Text> : <View style={styles.sensorContainer}>
          <SensorBadge active={sensors.available === true && !distractionDetected} label={sensorLabel} />
          {sensors.isMoving && sensors.available && <Text style={styles.movementText}>Movimiento detectado por el giroscopio</Text>}
          {sensors.error && <Text style={styles.sensorError}>{sensors.error}</Text>}
        </View>}

        {savingSession && <Text style={styles.syncText}>Guardando sesión en Supabase...</Text>}
        {alarmPermissionWarning && <Text style={styles.sensorError}>{alarmPermissionWarning}</Text>}
        {alarmError && <Text style={styles.sensorError}>{alarmError}</Text>}
        {focusSessionId && !savingSession && <Text style={styles.syncText}>Sesión sincronizada con Supabase</Text>}

        {distractionDetected && (
          <Card style={styles.distractionCard}>
            <Ionicons name="alert-circle-outline" size={30} color={colors.danger} />
            <Text style={styles.distractionTitle}>¡Distracción detectada!</Text>
            <Text style={styles.distractionMessage}>El teléfono fue levantado antes de finalizar el bloque y el cronómetro se pausó.</Text>
            <Button title="Preparar reanudación" onPress={requestResume} style={styles.fullButton} />
          </Card>
        )}

        {!distractionDetected && !isCompleted && (
          <View style={styles.buttonContainer}>
            {!sessionStarted && !waitingForFaceDown && (
              <Button title={preparingAlarm ? 'Preparando...' : 'Iniciar'} onPress={requestStart} disabled={continuePending || preparingAlarm || (fromBlock && (loadingPlan || planError)) || (!isRest && sensors.available !== true) || (!fromBlock && !validManualMinutes)} style={styles.controlButton} leftIcon={<Ionicons name="play" size={20} color={colors.white} />} />
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

        {sessionStarted && !isCompleted && <Button variant="danger" title="Terminar sesión" onPress={() => setShowGiveUpModal(true)} style={styles.fullButton} />}
      </ScrollView>

      <RNModal visible={isCompleted} transparent statusBarTranslucent animationType="fade" presentationStyle="overFullScreen" onRequestClose={() => undefined}>
        <SafeAreaView style={styles.completionOverlay}>
          <View style={styles.completionPopup}>
            <View style={styles.completionGlow}>
              <Ionicons name={isPlanFinished ? 'trophy' : isRest ? 'cafe' : 'checkmark-circle'} size={64} color={isPlanFinished ? colors.warning : colors.primary} />
            </View>
            <Text style={styles.completionEyebrow}>{isPlanFinished ? 'PLAN COMPLETADO' : isRest ? 'DESCANSO COMPLETADO' : fromBlock ? 'BLOQUE COMPLETADO' : 'SESIÓN MANUAL COMPLETADA'}</Text>
            <Text style={styles.completionTitle}>{isPlanFinished
              ? '¡Felicidades! Terminaste todo tu estudio.'
              : isRest
                ? '¡Descanso completado!'
                : '¡Felicidades! Completaste tu bloque de estudio.'}</Text>
            <Text style={styles.completionMessage}>{isPlanFinished
              ? `Completaste ${blocks.filter((block) => block.type !== 'descanso').length} bloques de enfoque y ${blocks.reduce((total, block) => total + block.durationMinutes, 0)} minutos del plan.`
              : `Completaste ${sessionMinutes.current} minutos de ${isRest ? 'descanso' : 'enfoque'}.`}</Text>
            {!isRest && <Text style={styles.completionMessage}>{displayedInterruptions === 0
              ? `No se detectaron interrupciones. ${isPlanFinished ? '¡Tu concentración fue excelente!' : '¡Excelente concentración!'}`
              : isPlanFinished
                ? `Se ${displayedInterruptions === 1 ? 'detectó 1 interrupción' : `detectaron ${displayedInterruptions} interrupciones`}, pero retomaste el plan y cumpliste tu objetivo. ¡Buen trabajo!`
                : `Se ${displayedInterruptions === 1 ? 'detectó 1 interrupción' : `detectaron ${displayedInterruptions} interrupciones`}, pero retomaste y completaste tu objetivo. ¡Buen trabajo!`}</Text>}
            {savingSession && <Text style={styles.syncText}>Guardando sesión en Supabase...</Text>}
            {completionError && <Text style={styles.sensorError}>No se pudo guardar la finalización.</Text>}
            {completionError && focusSessionId && <Button title="Reintentar guardar" onPress={() => { void completeFocusSession(focusSessionId, sessionMinutes.current).then(() => setCompletionError(false)).catch(() => setCompletionError(true)); }} />}
            {nextBlock && <Text style={styles.nextBlockText}>Siguiente: {nextBlock.title} ({nextBlock.durationMinutes} min)</Text>}
            <View style={styles.completionActions}>
              <Button title={nextBlock ? (nextBlock.type === 'descanso' ? 'Continuar con descanso' : 'Continuar con siguiente bloque') : 'Finalizar'} onPress={finishBlock} disabled={continuePending || savingSession || completionError} style={styles.fullButton} />
              <Button title={nextBlock ? 'Salir del plan y configurar manual' : 'Restablecer'} variant="secondary" onPress={resetSession} disabled={savingSession || completionError} style={styles.fullButton} />
            </View>
          </View>
        </SafeAreaView>
      </RNModal>

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
  content: { flexGrow: 1, padding: spacing.lg, justifyContent: 'center', alignItems: 'center', gap: spacing.lg },
  manualSettings: { width: '100%', alignItems: 'center', gap: spacing.sm },
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
  completionOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.96)', alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  completionPopup: { width: '100%', maxWidth: 440, backgroundColor: colors.surface, borderRadius: borderRadius.xl, borderWidth: 2, borderColor: colors.primary, padding: spacing.xl, alignItems: 'center', gap: spacing.md, elevation: 24 },
  completionGlow: { width: 112, height: 112, borderRadius: 56, backgroundColor: colors.primary + '20', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.primary + '55' },
  completionEyebrow: { ...typography.sm, color: colors.warning, fontWeight: fontWeights.bold, letterSpacing: 2 },
  completionTitle: { ...typography['3xl'], color: colors.textPrimary, fontWeight: fontWeights.bold, textAlign: 'center' },
  completionMessage: { ...typography.lg, color: colors.textSecondary, textAlign: 'center', lineHeight: 28, maxWidth: 420 },
  nextBlockText: { ...typography.md, color: colors.textPrimary, fontWeight: fontWeights.semibold, textAlign: 'center', marginTop: spacing.sm },
  completionActions: { width: '100%', maxWidth: 420, gap: spacing.md, marginTop: spacing.md },
});
