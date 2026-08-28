import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { colors, spacing, borderRadius, typography, fontWeights, shadows } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { MetricCard } from '../../components/ui/MetricCard';
import { mockDashboardMetrics } from '../../constants/mockData';
import { fetchStudyPlans } from '../../services/studyPlans';
import { StudyPlan } from '../../types';

const difficultyVariant = (difficulty: StudyPlan['difficulty']) => {
  if (difficulty === 'basico' || difficulty === 'intermedio') return 'success';
  if (difficulty === 'avanzado') return 'warning';
  return 'danger';
};

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const distractionCount = mockDashboardMetrics.distractions.split(' ')[0];
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [plansError, setPlansError] = useState<string | null>(null);

  const loadPlans = useCallback(() => {
    let active = true;

    setLoadingPlans(true);
    setPlansError(null);

    fetchStudyPlans()
      .then((data) => {
        if (!active) return;
        setPlans(data);
      })
      .catch((error) => {
        if (!active) return;
        setPlans([]);
        setPlansError(error instanceof Error ? error.message : 'No se pudieron cargar los planes.');
      })
      .finally(() => {
        if (!active) return;
        setLoadingPlans(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useFocusEffect(loadPlans);

  const handleOpenPlan = (planId: string) => {
    router.push(`/plans/${planId}` as never);
  };

  const handleStartPlan = (plan: StudyPlan) => {
    const firstBlock = plan.blocks[0];
    const params = new URLSearchParams();

    params.set('planId', plan.id);

    if (firstBlock) {
      params.set('blockId', firstBlock.id);
      params.set('durationMinutes', String(firstBlock.durationMinutes));
    }

    router.push(`/(tabs)/focus?${params.toString()}` as never);
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Seguro que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar sesión', style: 'destructive', onPress: () => { void logout(); } },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.greeting}>
          <Text style={styles.greetingText}>Hola, {user?.name || 'Estudiante'}</Text>
          <Text style={styles.greetingSubtext}>¿Qué vamos a aprender hoy?</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text style={styles.logoutText}>Salir</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.metricsGrid}>
          <MetricCard
            label="Tiempo enfocado"
            value={mockDashboardMetrics.focusedTime}
            icon="timer-outline"
            color={colors.primary}
            style={styles.metricCard}
          />
          <MetricCard
            label="Interrupciones"
            value={distractionCount}
            icon="alert-circle-outline"
            color={colors.danger}
            style={styles.metricCard}
          />
          <MetricCard
            label="Racha actual"
            value={mockDashboardMetrics.streak}
            icon="flame-outline"
            color={colors.warning}
            style={styles.metricCard}
          />
        </View>

        <Card style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View style={styles.progressTitleGroup}>
              <View style={styles.progressIcon}>
                <Ionicons name="flag-outline" size={18} color={colors.primary} />
              </View>
              <Text style={styles.progressTitle}>Progreso diario</Text>
            </View>
            <Text style={styles.progressPercent}>{mockDashboardMetrics.dailyGoal}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${mockDashboardMetrics.dailyGoal}%` }]} />
          </View>
          <Text style={styles.progressCaption}>Meta diaria alcanzada</Text>
        </Card>

        <Card style={styles.timelineCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Planes pendientes</Text>
            <TouchableOpacity onPress={() => router.push('/plans' as never)}>
              <Text style={styles.sectionLink}>Ver planes</Text>
            </TouchableOpacity>
          </View>

          {loadingPlans ? (
            <View style={styles.loadingPlansContainer}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.emptyText}>Cargando planes guardados...</Text>
            </View>
          ) : plans.length ? (
            plans.slice(0, 3).map((plan, index) => {
              const firstBlock = plan.blocks[0];

              return (
                <TouchableOpacity
                  key={plan.id}
                  style={styles.planItem}
                  onPress={() => handleOpenPlan(plan.id)}
                  activeOpacity={0.85}
                >
                  <View style={styles.planPosition}>
                    <Text style={styles.planPositionText}>{index + 1}</Text>
                  </View>
                  <View style={styles.timelineInfo}>
                    <Text style={styles.timelineTitle}>{plan.title}</Text>
                    <Text style={styles.timelineMeta}>
                      {plan.totalTime} • {plan.blocks.length} bloques
                      {firstBlock ? ` • inicia con ${firstBlock.duration}` : ''}
                    </Text>
                    <View style={styles.planFooter}>
                      <Badge text={plan.difficultyLabel} variant={difficultyVariant(plan.difficulty)} />
                      <TouchableOpacity
                        style={styles.startInlineButton}
                        onPress={() => handleStartPlan(plan)}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="play-outline" size={14} color={colors.white} />
                        <Text style={styles.startInlineText}>Iniciar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward-outline" size={22} color={colors.textMuted} />
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="calendar-clear-outline" size={28} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>No hay nada pendiente</Text>
              <Text style={styles.emptyText}>
                Cuando generes un plan desde IA Coach, aparecerá aquí para abrirlo o iniciar su primer bloque.
              </Text>
              <Button title="Crear plan con IA" size="sm" onPress={() => router.push('/(tabs)/ia-coach' as never)} />
            </View>
          )}

          {plansError ? <Text style={styles.errorText}>{plansError}</Text> : null}
        </Card>
      </ScrollView>
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
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  greeting: {
    flex: 1,
  },
  greetingText: {
    ...typography.xl,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  greetingSubtext: {
    ...typography.md,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.danger + '20',
    borderWidth: 1,
    borderColor: colors.danger,
  },
  logoutText: {
    ...typography.sm,
    fontWeight: fontWeights.semibold,
    color: colors.danger,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metricCard: {
    flexBasis: 0,
    minWidth: 0,
    padding: spacing.sm,
    borderLeftWidth: 3,
  },
  progressCard: {
    paddingVertical: spacing.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  progressTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTitle: {
    ...typography.md,
    fontWeight: fontWeights.semibold,
    color: colors.textPrimary,
  },
  progressPercent: {
    ...typography.xl,
    fontWeight: fontWeights.bold,
    color: colors.primary,
  },
  progressTrack: {
    height: 12,
    width: '100%',
    overflow: 'hidden',
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceHover,
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
  },
  progressCaption: {
    ...typography.sm,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  timelineCard: {
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    ...typography.lg,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  sectionLink: {
    ...typography.sm,
    fontWeight: fontWeights.semibold,
    color: colors.primary,
  },
  loadingPlansContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  planItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  planPosition: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  planPositionText: {
    ...typography.sm,
    fontWeight: fontWeights.bold,
    color: colors.primary,
  },
  timelineInfo: {
    flex: 1,
  },
  timelineTitle: {
    ...typography.md,
    fontWeight: fontWeights.semibold,
    color: colors.textPrimary,
  },
  timelineMeta: {
    ...typography.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  planFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    flexWrap: 'wrap',
  },
  startInlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
  },
  startInlineText: {
    ...typography.xs,
    fontWeight: fontWeights.semibold,
    color: colors.white,
  },
  emptyState: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    ...typography.lg,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  emptyText: {
    ...typography.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
  errorText: {
    ...typography.xs,
    color: colors.danger,
    textAlign: 'center',
  },
});
