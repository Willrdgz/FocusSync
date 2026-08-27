import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { mockStudyPlans } from '../../../constants/mockData';
import { borderRadius, colors, fontWeights, spacing, typography } from '../../../constants/theme';
import { fetchStudyPlanById } from '../../../services/studyPlans';
import { StudyPlan } from '../../../types';
import { getBlockTypeLabel } from '../../../utils/studyPlanFormatters';

export function PlanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [plan, setPlan] = useState<StudyPlan>(mockStudyPlans.find((item) => item.id === id) ?? mockStudyPlans[0]);
  const [loading, setLoading] = useState(Boolean(id));

  useEffect(() => {
    if (!id) return;

    let mounted = true;

    fetchStudyPlanById(id)
      .then((data) => {
        if (!mounted) return;
        setPlan(data);
      })
      .catch((error) => {
        if (!mounted) return;
        Alert.alert('Plan no disponible', error instanceof Error ? error.message : 'No se pudo cargar el plan.');
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [id]);

  const firstBlock = plan.blocks[0];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back-outline" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>{plan.title}</Text>
          <Text style={styles.subtitle}>{plan.totalTime} • {plan.blocks.length} bloques</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>Cargando detalle del plan...</Text>
          </View>
        )}

        <Badge text={plan.difficultyLabel} variant={plan.difficulty === 'basico' || plan.difficulty === 'intermedio' ? 'success' : plan.difficulty === 'avanzado' ? 'warning' : 'danger'} />

        {plan.description ? (
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Resumen del plan</Text>
            <Text style={styles.summaryDescription}>{plan.description}</Text>
            <View style={styles.summaryMeta}>
              <Ionicons name="save-outline" size={16} color={colors.success} />
              <Text style={styles.summaryMetaText}>Plan guardado en tu cuenta</Text>
            </View>
          </Card>
        ) : null}

        {plan.blocks.map((block, index) => (
          <Card key={block.id} style={styles.blockCard}>
            <View style={styles.blockHeader}>
              <View style={styles.blockNumber}>
                <Text style={styles.blockNumberText}>{index + 1}</Text>
              </View>
              <View style={styles.blockInfo}>
                <Text style={styles.blockTitle}>{block.title}</Text>
                <Text style={styles.blockMeta}>{block.duration} • {getBlockTypeLabel(block.type)}</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Recursos necesarios</Text>
            {block.resources.map((resource) => <Text key={resource} style={styles.listItem}>• {resource}</Text>)}

            <Text style={styles.sectionTitle}>Pasos metodológicos</Text>
            {block.steps.map((step) => <Text key={step} style={styles.listItem}>• {step}</Text>)}
          </Card>
        ))}

        <Button
          title="Iniciar Bloque 1"
          onPress={() => router.push(`/(tabs)/focus?planId=${plan.id}&blockId=${firstBlock?.id ?? ''}&durationMinutes=${firstBlock?.durationMinutes ?? 45}` as never)}
          disabled={!firstBlock}
        />
      </ScrollView>
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
  title: { ...typography.xl, fontWeight: fontWeights.bold, color: colors.textPrimary },
  subtitle: { ...typography.sm, color: colors.textMuted, marginTop: spacing.xs },
  content: { padding: spacing.lg, gap: spacing.lg },
  loadingContainer: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  loadingText: { ...typography.sm, color: colors.textMuted },
  summaryCard: { gap: spacing.sm },
  summaryTitle: { ...typography.lg, fontWeight: fontWeights.bold, color: colors.textPrimary },
  summaryDescription: { ...typography.sm, color: colors.textSecondary, lineHeight: 22 },
  summaryMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  summaryMetaText: { ...typography.sm, color: colors.success, fontWeight: fontWeights.semibold },
  blockCard: { gap: spacing.md },
  blockHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  blockNumber: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockNumberText: { ...typography.md, fontWeight: fontWeights.bold, color: colors.white },
  blockInfo: { flex: 1 },
  blockTitle: { ...typography.lg, fontWeight: fontWeights.semibold, color: colors.textPrimary },
  blockMeta: { ...typography.sm, color: colors.textMuted },
  sectionTitle: { ...typography.md, fontWeight: fontWeights.bold, color: colors.primary, marginTop: spacing.sm },
  listItem: { ...typography.sm, color: colors.textSecondary, lineHeight: 22 },
});
