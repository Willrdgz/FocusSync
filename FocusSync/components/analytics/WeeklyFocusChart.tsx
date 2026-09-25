import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WeeklyActivity } from '../../utils/analytics';
import { colors, spacing, typography } from '../../constants/theme';

export function WeeklyFocusChart({ data }: { data: WeeklyActivity[] }) {
  const maxMinutes = Math.max(1, ...data.map((item) => item.minutes));

  return (
    <View style={styles.container} accessibilityLabel="Gráfico de minutos enfocados durante los últimos siete días">
      {data.map((item) => {
        const height = item.minutes === 0 ? 4 : Math.max(12, Math.round((item.minutes / maxMinutes) * 96));
        return (
          <View key={item.date} style={styles.column}>
            <Text style={styles.value}>{item.minutes}</Text>
            <View style={styles.track}>
              <View style={[styles.bar, { height }]} />
            </View>
            <Text style={styles.day}>{item.day}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: 150, flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  column: { flex: 1, alignItems: 'center', gap: spacing.xs },
  value: { ...typography.xs, color: colors.textSecondary },
  track: { height: 96, width: '70%', justifyContent: 'flex-end', borderRadius: 8, backgroundColor: colors.surfaceHover },
  bar: { width: '100%', borderRadius: 8, backgroundColor: colors.primary },
  day: { ...typography.xs, color: colors.textMuted },
});
