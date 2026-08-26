import React from 'react';
import { TouchableOpacity, View, StyleSheet, Platform } from 'react-native';
import { colors, spacing } from '../../constants/theme';

interface MockIoTButtonProps {
  onDistraction: () => void;
  style?: any;
}

export const MockIoTButton = ({ onDistraction, style }: MockIoTButtonProps) => {
  if (Platform.OS === 'web') {
    return (
      <TouchableOpacity
        style={[styles.button, style]}
        onPress={onDistraction}
        accessible={false}
        accessibilityLabel="Simular distracción IoT"
      >
        <View style={styles.label} />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.invisibleButton, style]}
      onPress={onDistraction}
      accessible={false}
      accessibilityLabel="Simular distracción IoT"
      hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
    />
  );
};

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.danger + '20',
    borderWidth: 1,
    borderColor: colors.danger + '40',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  invisibleButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 80,
    height: 80,
    zIndex: 100,
  },
  label: {
    width: 24,
    height: 24,
    backgroundColor: colors.danger,
    borderRadius: 12,
  },
});
