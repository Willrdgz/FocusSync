import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ActivityIndicator } from 'react-native';
import { ButtonProps } from '../../types';
import { colors, spacing, borderRadius, typography, fontWeights, shadows } from '../../constants/theme';

const sizeStyles = {
  sm: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, minHeight: 40, ...typography.sm },
  md: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg, minHeight: 52, ...typography.md },
  lg: { paddingVertical: spacing.lg, paddingHorizontal: spacing.xl, minHeight: 60, ...typography.lg },
};

export const Button = React.forwardRef<React.ElementRef<typeof TouchableOpacity>, ButtonProps>(
  ({
    title,
    onPress,
    variant = 'primary',
    disabled = false,
    loading = false,
    style,
    leftIcon,
    icon,
    size = 'md',
  }, ref) => {
    const sizeStyle = sizeStyles[size];
    const baseStyles = [styles.base, sizeStyle, styles[variant], disabled && styles.disabled, loading && styles.loading, style];

    return (
      <TouchableOpacity
        ref={ref}
        style={baseStyles}
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.85}
        accessibilityRole="button"
      >
        {loading ? (
          <ActivityIndicator size="small" color={colors.white} />
        ) : (
          <View style={styles.content}>
            {(leftIcon || icon) && <View style={styles.iconWrapper}>{leftIcon || icon}</View>}
            {title && <Text style={[styles.title, variant === 'google' && styles.googleTitle, (leftIcon || icon) && styles.titleWithIcon]}>{title}</Text>}
          </View>
        )}
      </TouchableOpacity>
    );
  }
);

Button.displayName = 'Button';

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.surfaceHover,
    borderWidth: 1,
    borderColor: colors.border,
  },
  google: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.white,
  },
  danger: {
    backgroundColor: colors.danger,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.5,
  },
  loading: {
    opacity: 0.8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  iconWrapper: {
    flexShrink: 0,
  },
  title: {
    fontWeight: fontWeights.semibold,
    color: colors.white,
  },
  googleTitle: {
    color: colors.background,
  },
  titleWithIcon: {},
});
