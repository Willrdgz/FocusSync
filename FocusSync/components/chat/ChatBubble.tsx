import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { ChatMessage, ChatBubbleProps } from '../../types';
import { colors, spacing, borderRadius, typography, fontWeights } from '../../constants/theme';
import { Button } from '../ui/Button';
import { Ionicons } from '@expo/vector-icons';

export const ChatBubble = React.forwardRef<View, ChatBubbleProps>(
  ({ message, onAction }, ref) => {
    const isUser = message.role === 'user';

    return (
      <View ref={ref} style={[styles.container, isUser && styles.userContainer]}>
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
          <Text style={[styles.text, isUser ? styles.userText : styles.aiText]}>
            {message.content}
          </Text>
        </View>
        {message.action && (
          <View style={[styles.actionContainer, isUser && styles.userActionContainer]}>
            <Button
              variant="primary"
              size="sm"
              title={message.action.label}
              leftIcon={<Ionicons name={isUser ? 'send-outline' : 'play-outline'} size={16} color={colors.white} />}
              onPress={() => message.action && onAction?.(message.action)}
              style={styles.actionButton}
            />
          </View>
        )}
      </View>
    );
  }
);

ChatBubble.displayName = 'ChatBubble';

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
    maxWidth: '85%',
  },
  userContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  bubble: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: spacing.sm,
  },
  aiBubble: {
    backgroundColor: colors.surfaceHover,
    borderBottomLeftRadius: spacing.sm,
  },
  text: {
    ...typography.md,
    lineHeight: 22,
  },
  userText: {
    color: colors.white,
  },
  aiText: {
    color: colors.textPrimary,
  },
  actionContainer: {
    marginTop: spacing.sm,
    width: '100%',
  },
  userActionContainer: {
    alignItems: 'flex-end',
  },
  actionButton: {
    minWidth: 140,
  },
});