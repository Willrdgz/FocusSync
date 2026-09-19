import React from 'react';
import { View, TextInput, StyleSheet, Keyboard } from 'react-native';
import { ChatInputProps } from '../../types';
import { colors, spacing, borderRadius, typography, fontWeights, shadows } from '../../constants/theme';
import { Button } from '../ui/Button';
import { Ionicons } from '@expo/vector-icons';

export const ChatInput = React.forwardRef<View, ChatInputProps>(
  ({ onSend, disabled = false, style }, ref) => {
    const [text, setText] = React.useState('');

    const handleSubmit = () => {
      if (text.trim() && !disabled) {
        onSend(text.trim());
        setText('');
        Keyboard.dismiss();
      }
    };

    return (
      <View ref={ref} style={[styles.container, style]}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            onSubmitEditing={handleSubmit}
            placeholder="Escribe un mensaje..."
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={500}
            editable={!disabled}
          />
          <Button
            variant="primary"
            icon={<Ionicons name="send-outline" size={22} color={colors.white} />}
            onPress={handleSubmit}
            disabled={!text.trim() || disabled}
            style={styles.sendButton}
          />
        </View>
      </View>
    );
  }
);

ChatInput.displayName = 'ChatInput';

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...shadows.lg,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    backgroundColor: colors.surfaceHover,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  input: {
    flex: 1,
    ...typography.md,
    color: colors.textPrimary,
    maxHeight: 120,
    paddingVertical: spacing.xs,
  },
  sendButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
});
