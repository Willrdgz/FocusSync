import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { CardProps } from '../../types';
import { colors, spacing, borderRadius, shadows } from '../../constants/theme';

export const Card = React.forwardRef<View, CardProps>(
  ({ children, style, onPress }, ref) => {
    if (onPress) {
      return (
        <TouchableOpacity
          ref={ref as React.Ref<React.ElementRef<typeof TouchableOpacity>>}
          style={[styles.base, style]}
          onPress={onPress}
          activeOpacity={0.95}
        >
          {children}
        </TouchableOpacity>
      );
    }

    return (
      <View
        ref={ref}
        style={[styles.base, style]}
      >
        {children}
      </View>
    );
  }
);

Card.displayName = 'Card';

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
});
