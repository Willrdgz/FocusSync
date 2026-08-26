import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { ChatMessage } from '../../types';
import { ChatBubble } from './ChatBubble';
import { colors, spacing } from '../../constants/theme';

interface MessageListProps {
  messages: ChatMessage[];
  onAction?: (action: ChatMessage['action']) => void;
  style?: any;
  contentContainerStyle?: any;
}

export const MessageList = React.forwardRef<ScrollView, MessageListProps>(
  ({ messages, onAction, style, contentContainerStyle }, ref) => {
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
});