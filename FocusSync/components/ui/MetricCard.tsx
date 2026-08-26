import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MetricCardProps } from '../../types';
import { colors, spacing, borderRadius, typography, fontWeights, shadows } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export const MetricCard = React.forwardRef<View, MetricCardProps>(
  ({ label, value, icon, color, style }, ref) => {
    return (
      <View
        ref={ref}
        style={[
          styles.container,
          { borderLeftColor: color },
          style,
        ]}
      >
        <View style={styles.iconWrapper}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
        <View style={styles.content}>
          <Text style={styles.value}>{value}</Text>
          <Text style={styles.label}>{label}</Text>
        </View>
      </View>
    );
  }
);

MetricCard.displayName = 'MetricCard';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderLeftWidth: 4,
    ...shadows.sm,
  },
  iconWrapper: {
    backgroundColor: colors.surfaceHover,
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  content: {},
  value: {
    ...typography.xl,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  label: {
    ...typography.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
});
