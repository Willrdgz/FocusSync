import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '../../../components/ui/Badge';
import { Card } from '../../../components/ui/Card';
import { borderRadius, colors, fontWeights, spacing, typography } from '../../../constants/theme';
import { StudyPlan } from '../../../types';
import { fetchStudyPlans } from '../../../services/studyPlans';

const difficultyVariant = (difficulty: StudyPlan['difficulty']) => {
  if (difficulty === 'basico' || difficulty === 'intermedio') return 'success';
  if (difficulty === 'avanzado') return 'warning';
  return 'danger';
};

export function PlansScreen() {
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    setLoading(true);
    setError(null);

    fetchStudyPlans()
      .then((data) => {
        if (!mounted) return;
        setPlans(data);
      })
      .catch((error) => {
        if (!mounted) return;
        setPlans([]);
        setError(error instanceof Error ? error.message : 'No se pudieron cargar los planes.');
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back-outline" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Planes de estudio</Text>
          <Text style={styles.subtitle}>Rutinas generadas por IA y listas para ejecutar</Text>
        </View>
      </View>

      <FlatList
        data={plans}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.loadingText}>Cargando planes guardados...</Text>
            </View>
          ) : error ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="alert-circle-outline" size={32} color={colors.danger} />
              <Text style={styles.emptyTitle}>No pudimos cargar tus planes</Text>
              <Text style={styles.emptyText}>{error}</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-clear-outline" size={32} color={colors.primary} />
              <Text style={styles.emptyTitle}>Aún no tienes planes</Text>
              <Text style={styles.emptyText}>Genera uno desde IA Coach y aparecerá aquí.</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <Card style={styles.planCard} onPress={() => router.push(`/plans/${item.id}` as never)}>
            <View style={styles.planHeader}>
              <View style={styles.planIcon}>
                <Ionicons name="file-tray-full-outline" size={24} color={colors.primary} />
              </View>
              <View style={styles.planInfo}>
                <Text style={styles.planTitle}>{item.title}</Text>
                <Text style={styles.planMeta}>{item.totalTime} • {item.blocks.length} bloques</Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={22} color={colors.textMuted} />
            </View>
            <Badge text={item.difficultyLabel} variant={difficultyVariant(item.difficulty)} />
          </Card>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1 },
  title: { ...typography['2xl'], fontWeight: fontWeights.bold, color: colors.textPrimary },
  subtitle: { ...typography.sm, color: colors.textMuted, marginTop: spacing.xs },
  list: { padding: spacing.lg, gap: spacing.md },
  loadingContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  loadingText: { ...typography.sm, color: colors.textMuted },
  emptyContainer: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxl, paddingHorizontal: spacing.lg },
  emptyTitle: { ...typography.lg, fontWeight: fontWeights.semibold, color: colors.textPrimary },
  emptyText: { ...typography.sm, color: colors.textMuted, textAlign: 'center' },
  planCard: { gap: spacing.md },
  planHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  planIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planInfo: { flex: 1 },
  planTitle: { ...typography.lg, fontWeight: fontWeights.semibold, color: colors.textPrimary },
  planMeta: { ...typography.sm, color: colors.textMuted, marginTop: spacing.xs },
});
