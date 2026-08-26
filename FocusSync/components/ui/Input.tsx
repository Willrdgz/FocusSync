import React from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { InputProps } from '../../types';
import { colors, spacing, borderRadius, typography, fontWeights, shadows } from '../../constants/theme';

export const Input = React.forwardRef<TextInput, InputProps>(
  ({
    placeholder,
    value,
    onChangeText,
    secureTextEntry = false,
    label,
    error,
    style,
    ...props
  }, ref) => {
    const [focused, setFocused] = React.useState(false);
    const hasError = !!error;

    return (
      <View style={[styles.container, style]}>
        {label && (
          <Text style={styles.label}>{label}</Text>
        )}
        <View style={[styles.inputWrapper, focused && styles.inputFocused, hasError && styles.inputError]}>
          <TextInput
            ref={ref}
            style={styles.input}
            placeholder={placeholder}
            value={value}
            onChangeText={onChangeText}
            secureTextEntry={secureTextEntry}
            placeholderTextColor={colors.textMuted}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            {...props}
          />
        </View>
        {hasError && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    ...typography.sm,
    fontWeight: fontWeights.medium,
    color: colors.textSecondary,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadows.sm,
  },
  inputFocused: {
    borderColor: colors.inputFocusBorder,
    borderWidth: 2,
  },
  inputError: {
    borderColor: colors.danger,
  },
  input: {
    flex: 1,
    ...typography.md,
    color: colors.textPrimary,
  },
  errorText: {
    ...typography.xs,
    color: colors.danger,
    marginLeft: spacing.xs,
  },
});