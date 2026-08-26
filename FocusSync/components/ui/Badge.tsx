import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BadgeProps } from '../../types';
import { colors, spacing, borderRadius, typography, fontWeights } from '../../constants/theme';

const variantStyles = {
  success: {
    backgroundColor: colors.success + '20',
    textColor: colors.success,
    dotColor: colors.success,
  },
  danger: {
    backgroundColor: colors.danger + '20',
    textColor: colors.danger,
    dotColor: colors.danger,
  },
  warning: {
    backgroundColor: colors.warning + '20',
    textColor: colors.warning,
    dotColor: colors.warning,
  },
  info: {
    backgroundColor: colors.primary + '20',
    textColor: colors.primary,
    dotColor: colors.primary,
  },
};

export const Badge = React.memo(({ text, variant = 'info', style }: BadgeProps) => {
  const { backgroundColor, textColor, dotColor } = variantStyles[variant];

  return (
    <View style={[styles.base, { backgroundColor }, style]}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <Text style={[styles.text, { color: textColor }]}>{text}</Text>
    </View>
  );
});

Badge.displayName = 'Badge';

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    ...typography.sm,
    fontWeight: fontWeights.medium,
  },
});