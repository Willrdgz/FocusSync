import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { Card } from '../../components/ui/Card';
import { borderRadius, colors, fontWeights, spacing, typography } from '../../constants/theme';
import { fetchDashboardSummary } from '../../lib/service';
import { Achievement } from '../../utils/analytics';

const formatUnlockDate = (date: string | null) => {
  if (!date) return null;
  return new Intl.DateTimeFormat('es-SV', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(date));
};

export default function AchievementsScreen() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    setError(null);
    fetchDashboardSummary()
      .then((summary) => {
        if (active) setAchievements(summary?.achievements ?? []);
      })
      .catch((reason) => {
        if (active) setError(reason instanceof Error ? reason.message : 'No se pudieron cargar los logros.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Logros</Text>
        <Text style={styles.subtitle}>Tu progreso se actualiza con cada sesión</Text>
      </View>
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : error ? (
        <View style={styles.center}><Text style={styles.error}>{error}</Text></View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {achievements.map((achievement) => {
            const progress = Math.min(100, Math.round((achievement.current / achievement.target) * 100));
            const unlockedDate = formatUnlockDate(achievement.unlockedAt);
            return (
              <Card key={achievement.id} style={[styles.card, !achievement.unlocked && styles.locked]}>
                <View style={[styles.icon, achievement.unlocked && styles.iconUnlocked]}>
                  <Ionicons name={achievement.unlocked ? achievement.icon : 'lock-closed-outline'} size={28} color={achievement.unlocked ? colors.warning : colors.textMuted} />
                </View>
                <View style={styles.info}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.achievementTitle}>{achievement.title}</Text>
                    <Text style={styles.progressText}>{progress}%</Text>
                  </View>
                  <Text style={styles.description}>{achievement.description}</Text>
                  <View style={styles.track}><View style={[styles.fill, { width: `${progress}%` }]} /></View>
                  <Text style={styles.caption}>
                    {achievement.unlocked
                      ? `Desbloqueado${unlockedDate ? ` · ${unlockedDate}` : ''}`
                      : `${achievement.current} de ${achievement.target} ${achievement.unit}`}
                  </Text>
                </View>
              </Card>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface },
  title: { ...typography['2xl'], color: colors.textPrimary, fontWeight: fontWeights.bold },
  subtitle: { ...typography.sm, color: colors.textMuted, marginTop: spacing.xs },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  error: { ...typography.md, color: colors.danger, textAlign: 'center' },
  card: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  locked: { opacity: 0.72 },
  icon: { width: 52, height: 52, borderRadius: borderRadius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceHover },
  iconUnlocked: { backgroundColor: colors.warning + '20', borderWidth: 1, borderColor: colors.warning },
  info: { flex: 1, gap: spacing.xs },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  achievementTitle: { ...typography.md, color: colors.textPrimary, fontWeight: fontWeights.bold, flex: 1 },
  progressText: { ...typography.sm, color: colors.primary, fontWeight: fontWeights.bold },
  description: { ...typography.sm, color: colors.textSecondary },
  track: { height: 7, borderRadius: borderRadius.full, backgroundColor: colors.surfaceHover, overflow: 'hidden', marginTop: spacing.xs },
  fill: { height: '100%', borderRadius: borderRadius.full, backgroundColor: colors.primary },
  caption: { ...typography.xs, color: colors.textMuted },
});
