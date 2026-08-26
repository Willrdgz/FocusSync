import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { colors, spacing, borderRadius, typography, fontWeights, shadows } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { MetricCard } from '../../components/ui/MetricCard';
import { ProgressRing } from '../../components/ui/ProgressRing';
import { mockDailyActivities, mockDashboardMetrics, mockNextSession } from '../../constants/mockData';

export default function DashboardScreen() {
  const { user, logout } = useAuth();

  const handleStartSession = () => {
    router.push('/(tabs)/focus');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.greeting}>
          <Text style={styles.greetingText}>Hola, {user?.name || 'Estudiante'}</Text>
          <Text style={styles.greetingSubtext}>¿Qué vamos a aprender hoy?</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="log-out-outline" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.metricsGrid}>
          <MetricCard
            label="Tiempo enfocado hoy"
            value={mockDashboardMetrics.focusedTime}
            icon="timer-outline"
            color={colors.primary}
          />
          <MetricCard
            label="Distracciones detectadas"
            value={mockDashboardMetrics.distractions}
            icon="alert-circle-outline"
            color={colors.danger}
          />
          <MetricCard
            label="Racha actual"
            value={mockDashboardMetrics.streak}
            icon="flame-outline"
            color={colors.warning}
          />
          <MetricCard
            label="Meta diaria"
            value={`${mockDashboardMetrics.dailyGoal}%`}
            icon="flag-outline"
            color={colors.success}
          />
        </View>

        <Card style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Progreso de la meta diaria</Text>
            <Text style={styles.progressPercent}>{mockDashboardMetrics.dailyGoal}%</Text>
          </View>
          <ProgressRing
            progress={mockDashboardMetrics.dailyGoal / 100}
            size={140}
            strokeWidth={10}
            color={colors.primary}
          >
            <View style={styles.progressCenter}>
              <Text style={styles.progressCenterText}>Completado</Text>
            </View>
          </ProgressRing>
        </Card>

        <Card style={styles.nextSessionCard} onPress={handleStartSession}>
          <View style={styles.nextSessionHeader}>
            <View style={styles.nextSessionIcon}>
              <MaterialCommunityIcons name="calendar-clock" size={24} color={colors.primary} />
            </View>
            <View style={styles.nextSessionInfo}>
              <Text style={styles.nextSessionLabel}>Próxima sesión sugerida</Text>
              <Text style={styles.nextSessionSubject}>{mockNextSession.subject}</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={24} color={colors.textMuted} />
          </View>
          <View style={styles.nextSessionFooter}>
            <View style={styles.nextSessionDuration}>
              <Ionicons name="time-outline" size={16} color={colors.textMuted} />
              <Text style={styles.nextSessionDurationText}>{mockNextSession.duration}</Text>
            </View>
            <Button
              title="Iniciar"
              variant="primary"
              size="sm"
              onPress={handleStartSession}
              style={styles.nextSessionButton}
            />
          </View>
        </Card>

        <Card style={styles.timelineCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Actividades de hoy</Text>
            <TouchableOpacity onPress={() => router.push('/plans' as never)}>
              <Text style={styles.sectionLink}>Ver planes</Text>
            </TouchableOpacity>
          </View>
          {mockDailyActivities.map((activity) => (
            <View key={activity.id} style={styles.timelineItem}>
              <View style={[styles.timelineDot, activity.status === 'completed' && styles.timelineDotCompleted]} />
              <View style={styles.timelineInfo}>
                <Text style={styles.timelineTitle}>{activity.title}</Text>
                <Text style={styles.timelineMeta}>{activity.time} • {activity.duration}</Text>
              </View>
              <Text style={styles.timelineStatus}>
                {activity.status === 'completed' ? 'Completada' : activity.status === 'upcoming' ? 'Próxima' : 'Pendiente'}
              </Text>
            </View>
          ))}
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
    padding: spacing.sm,
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
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  progressCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 280,
    marginBottom: spacing.lg,
  },
  progressTitle: {
    ...typography.lg,
    fontWeight: fontWeights.semibold,
    color: colors.textPrimary,
  },
  progressPercent: {
    ...typography['2xl'],
    fontWeight: fontWeights.bold,
    color: colors.primary,
  },
  progressCenter: {
    alignItems: 'center',
  },
  progressCenterText: {
    ...typography.sm,
    color: colors.textMuted,
  },
  nextSessionCard: {
    padding: spacing.md,
  },
  nextSessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  nextSessionIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextSessionInfo: {
    flex: 1,
  },
  nextSessionLabel: {
    ...typography.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nextSessionSubject: {
    ...typography.lg,
    fontWeight: fontWeights.semibold,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  nextSessionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  nextSessionDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  nextSessionDurationText: {
    ...typography.md,
    fontWeight: fontWeights.medium,
    color: colors.textSecondary,
  },
  nextSessionButton: {
    minWidth: 100,
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
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.warning,
  },
  timelineDotCompleted: {
    backgroundColor: colors.success,
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
  },
  timelineStatus: {
    ...typography.xs,
    color: colors.textSecondary,
  },
});
