import React from 'react';
import { ActivityIndicator, View, ScrollView, StyleSheet, Text } from 'react-native';
import { ChatMessage } from '../../types';
import { ChatBubble } from './ChatBubble';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';

interface MessageListProps {
  messages: ChatMessage[];
  loading?: boolean;
  onAction?: (action: ChatMessage['action']) => void;
  style?: any;
  contentContainerStyle?: any;
}

export const MessageList = React.forwardRef<ScrollView, MessageListProps>(
  ({ messages, loading = false, onAction, style, contentContainerStyle }, ref) => {
    return (
      <ScrollView
        ref={ref}
        style={[styles.container, style]}
        contentContainerStyle={[styles.content, contentContainerStyle]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map((message) => (
          <ChatBubble key={message.id} message={message} onAction={onAction} />
        ))}
        {loading && (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingBubble}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingText}>IA Coach está preparando tu plan...</Text>
            </View>
          </View>
        )}
      </ScrollView>
    );
  }
);

MessageList.displayName = 'MessageList';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
  },
  content: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  loadingContainer: {
    alignSelf: 'flex-start',
    maxWidth: '85%',
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderBottomLeftRadius: spacing.sm,
    backgroundColor: colors.surfaceHover,
  },
  loadingText: {
    ...typography.sm,
    color: colors.textMuted,
  },
});
