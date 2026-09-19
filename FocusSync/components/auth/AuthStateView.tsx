import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../ui/Button';
import { borderRadius, colors, fontWeights, spacing, typography } from '../../constants/theme';

interface AuthStateViewProps {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  loading?: boolean;
}

export function AuthStateView({
  title = 'Preparando FocusSync',
  message = 'Estamos verificando tu sesion.',
  actionLabel,
  onAction,
  loading = true,
}: AuthStateViewProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <Ionicons name="alert-circle-outline" size={30} color={colors.danger} />
        )}
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction && (
        <Button title={actionLabel} variant="secondary" onPress={onAction} style={styles.button} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.background,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    ...typography.xl,
    color: colors.textPrimary,
    fontWeight: fontWeights.bold,
    textAlign: 'center',
  },
  message: {
    ...typography.md,
    color: colors.textMuted,
    textAlign: 'center',
  },
  button: {
    marginTop: spacing.sm,
  },
});
