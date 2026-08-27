import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { ChatMessage, ChatBubbleProps } from '../../types';
import { colors, spacing, borderRadius, typography, fontWeights } from '../../constants/theme';
import { Button } from '../ui/Button';
import { Ionicons } from '@expo/vector-icons';
import { getBlockTypeLabel } from '../../utils/studyPlanFormatters';

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

        {!isUser && message.plan && (
          <View style={styles.planCard}>
            <View style={styles.planHeader}>
              <View style={styles.planIcon}>
                <Ionicons name="sparkles-outline" size={18} color={colors.white} />
              </View>
              <View style={styles.planHeaderText}>
                <Text style={styles.planTitle}>{message.plan.title}</Text>
                <Text style={styles.planMeta}>
                  {message.plan.totalTime} • {message.plan.blocks.length} bloques • {message.plan.difficultyLabel}
                </Text>
              </View>
            </View>

            {message.plan.description ? (
              <Text style={styles.planDescription}>{message.plan.description}</Text>
            ) : null}

            <View style={styles.blockList}>
              {message.plan.blocks.slice(0, 3).map((block, index) => (
                <View key={block.id} style={styles.blockPreview}>
                  <View style={styles.blockNumber}>
                    <Text style={styles.blockNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.blockText}>
                    <Text style={styles.blockTitle}>{block.title}</Text>
                    <Text style={styles.blockMeta}>
                      {block.duration} • {getBlockTypeLabel(block.type)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {message.plan.blocks.length > 3 && (
              <Text style={styles.moreBlocks}>+{message.plan.blocks.length - 3} bloque(s) más en el detalle</Text>
            )}

            <TouchableOpacity
              style={styles.detailButton}
              onPress={() => router.push(`/plans/${message.plan?.id}` as never)}
              activeOpacity={0.85}
            >
              <Ionicons name="document-text-outline" size={16} color={colors.primary} />
              <Text style={styles.detailButtonText}>Ver detalle del plan guardado</Text>
            </TouchableOpacity>
          </View>
        )}

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
  planCard: {
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  planIcon: {
    width: 34,
    height: 34,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planHeaderText: {
    flex: 1,
  },
  planTitle: {
    ...typography.md,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  planMeta: {
    ...typography.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  planDescription: {
    ...typography.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  blockList: {
    gap: spacing.sm,
  },
  blockPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  blockNumber: {
    width: 26,
    height: 26,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceHover,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockNumberText: {
    ...typography.xs,
    fontWeight: fontWeights.bold,
    color: colors.primary,
  },
  blockText: {
    flex: 1,
  },
  blockTitle: {
    ...typography.sm,
    fontWeight: fontWeights.semibold,
    color: colors.textPrimary,
  },
  blockMeta: {
    ...typography.xs,
    color: colors.textMuted,
  },
  moreBlocks: {
    ...typography.xs,
    color: colors.textMuted,
  },
  detailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
  },
  detailButtonText: {
    ...typography.sm,
    fontWeight: fontWeights.semibold,
    color: colors.primary,
  },
});
