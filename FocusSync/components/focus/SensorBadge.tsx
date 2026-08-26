import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography, fontWeights } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface SensorBadgeProps {
  active: boolean;
  label?: string;
  style?: any;
}

export const SensorBadge = React.memo(({ active, label, style }: SensorBadgeProps) => {
  return (
    <View style={[styles.container, active ? styles.active : styles.inactive, style]}>
      <View style={[styles.dot, active ? styles.dotActive : styles.dotInactive]} />
      <Text style={[styles.text, active ? styles.textActive : styles.textInactive]}>
        {label ?? (active ? 'Sensores activos' : 'Sensores inactivos')}
      </Text>
    </View>
  );
});

SensorBadge.displayName = 'SensorBadge';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceHover,
    borderWidth: 1,
  },
  active: {
    borderColor: colors.success + '40',
  },
  inactive: {
    borderColor: colors.danger + '40',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: colors.success,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  dotInactive: {
    backgroundColor: colors.danger,
  },
  text: {
    ...typography.sm,
    fontWeight: fontWeights.medium,
  },
  textActive: {
    color: colors.success,
  },
  textInactive: {
    color: colors.danger,
  },
});
