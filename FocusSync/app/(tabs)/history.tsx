import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { colors, spacing, borderRadius, typography, fontWeights } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../hooks/useAuth';
import { fetchFocusSessions } from '../../lib/service';
import { Session } from '../../types';
import { buildStudyAdvice } from '../../utils/studyAdvice';

interface SessionCardProps {
  session: Session;
}

const SessionCard = ({ session }: SessionCardProps) => (
  <Card style={styles.sessionCard}>
    <View style={styles.sessionHeader}>
      <View style={styles.sessionIcon}>
        <MaterialCommunityIcons name="book-open-page-variant" size={24} color={colors.primary} />
      </View>
      <View style={styles.sessionInfo}>
        <Text style={styles.sessionSubject}>{session.subject}</Text>
        <Text style={styles.sessionDuration}>
          {session.completed} min de {session.duration} min completados
        </Text>
        <Text style={styles.sessionComparison}>
          Planificado: {session.plannedDuration ?? session.duration} min • Real: {session.actualDuration ?? session.completed} min
        </Text>
      </View>
      <View style={styles.sessionStatus}>
        <Ionicons name="checkmark-circle" size={24} color={colors.success} />
      </View>
    </View>
    <View style={styles.sessionFooter}>
      <Badge
        text={session.interruptions === 0 ? '0 Interrupciones' : `${session.interruptions} Interrupciones`}
        variant={session.interruptions === 0 ? 'success' : 'danger'}
      />
    </View>
  </Card>
);

export default function HistoryScreen() {
  const { session: authSession } = useAuth();
  const userId = authSession?.user.id;
  const [adviceVisible, setAdviceVisible] = useState(true);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (!userId) { setSessions([]); setLoading(false); return; }
      setAdviceVisible(true);
      setLoading(true);

      fetchFocusSessions()
        .then((data) => {
          if (active) setSessions(data);
        })
        .catch(() => {
          if (active) setSessions([]);
        })
        .finally(() => {
          if (active) setLoading(false);
        });

      return () => {
        active = false;
      };
    }, [userId])
  );

  const advice = buildStudyAdvice(sessions);

  const renderItem = ({ item }: { item: Session }) => (
    <TouchableOpacity style={styles.listItem} activeOpacity={0.9}>
      <SessionCard session={item} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Historial</Text>
        <Text style={styles.headerSubtitle}>Tus sesiones de estudio</Text>
      </View>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={sessions}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, adviceVisible && styles.listContentWithAdvice]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="time-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>No hay sesiones aún</Text>
              <Text style={styles.emptySubtext}>Completa tu primera sesión en Enfoque</Text>
            </View>
          }
        />
      )}

      {adviceVisible && !loading && <View style={styles.aiFeedbackContainer}>
        <Card style={styles.aiFeedbackCard}>
          <View style={styles.aiFeedbackHeader}>
            <View style={styles.aiFeedbackIcon}>
              <Ionicons name="sparkles" size={20} color={colors.primary} />
            </View>
            <View style={styles.aiFeedbackHeading}>
              <Text style={styles.aiFeedbackTitle}>{advice.title}</Text>
              <Text style={styles.aiFeedbackLabel}>Consejo de enfoque</Text>
            </View>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Cerrar consejo" onPress={() => setAdviceVisible(false)} style={styles.closeAdvice}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.aiFeedbackText}>{advice.message}</Text>
        </Card>
      </View>}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerTitle: {
    ...typography['2xl'],
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    ...typography.md,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  listContentWithAdvice: { paddingBottom: 230 },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listItem: {
    width: '100%',
  },
  sessionCard: {
    padding: spacing.md,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  sessionIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionSubject: {
    ...typography.lg,
    fontWeight: fontWeights.semibold,
    color: colors.textPrimary,
  },
  sessionDuration: {
    ...typography.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  sessionComparison: {
    ...typography.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sessionStatus: {
    padding: spacing.sm,
  },
  sessionFooter: {
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  emptyText: {
    ...typography.lg,
    fontWeight: fontWeights.semibold,
    color: colors.textSecondary,
  },
  emptySubtext: {
    ...typography.md,
    color: colors.textMuted,
    textAlign: 'center',
  },
  aiFeedbackContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    zIndex: 20,
    elevation: 20,
  },
  aiFeedbackCard: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    opacity: 1,
    elevation: 20,
  },
  aiFeedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  aiFeedbackHeading: { flex: 1 },
  aiFeedbackLabel: { ...typography.xs, color: colors.textMuted, marginTop: 2 },
  closeAdvice: { padding: spacing.sm, marginRight: -spacing.sm },
  aiFeedbackIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiFeedbackTitle: {
    ...typography.md,
    fontWeight: fontWeights.bold,
    color: colors.primary,
  },
  aiFeedbackText: {
    ...typography.md,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  adviceSource: { ...typography.xs, color: colors.textMuted, marginTop: spacing.sm },
});
