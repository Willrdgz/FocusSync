import React, { useState, useRef, useEffect } from 'react';
import { Alert, View, Text, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, spacing, typography, fontWeights } from '../../constants/theme';
import { MessageList } from '../../components/chat/MessageList';
import { ChatInput } from '../../components/chat/ChatInput';
import { ChatMessage } from '../../types';
import { generateStudyPlan } from '../../services/studyPlans';
import { useAuth } from '../../hooks/useAuth';

const getTimeGreeting = () => {
  const hour = new Date().getHours();

  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
};

export default function IACoachScreen() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      role: 'assistant',
      content: `${getTimeGreeting()}, ${user?.name?.trim().split(' ')[0] || 'Oscar'}. ¿Qué deseas implementar hoy?`,
    },
  ]);
  const [sending, setSending] = useState(false);
  const tabBarHeight = useBottomTabBarHeight();
  const messageListRef = useRef<ScrollView>(null);

  const scrollToBottom = () => {
    if (messageListRef.current) {
      messageListRef.current.scrollToEnd({ animated: true });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

  const handleSendMessage = async (text: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setSending(true);

    try {
      const response = await generateStudyPlan(text);
      const firstBlock = response.plan.blocks[0];
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message,
        plan: response.plan,
        action: firstBlock
          ? {
              label: 'Iniciar Bloque 1',
              screen: 'focus',
              planId: response.plan.id,
              blockId: firstBlock.id,
              durationMinutes: firstBlock.durationMinutes,
            }
          : undefined,
      };

      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo generar el plan.';
      Alert.alert('IA Coach no disponible', message);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `No pude generar el plan ahora. ${message}`,
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleAction = (action: ChatMessage['action']) => {
    if (action?.screen === 'focus') {
      const params = new URLSearchParams();
      if (action.planId) params.set('planId', action.planId);
      if (action.blockId) params.set('blockId', action.blockId);
      if (action.durationMinutes) params.set('durationMinutes', String(action.durationMinutes));

      router.push(`/(tabs)/focus${params.toString() ? `?${params.toString()}` : ''}` as never);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={0}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>IA Coach</Text>
              <Text style={styles.headerSubtitle}>Tu planificador inteligente</Text>
            </View>
            <TouchableOpacity style={styles.infoButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="information-circle-outline" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <MessageList
            ref={messageListRef}
            messages={messages}
            loading={sending}
            onAction={handleAction}
            style={styles.messageList}
            contentContainerStyle={styles.messageListContent}
          />

          <ChatInput
            onSend={handleSendMessage}
            disabled={sending}
            style={[styles.chatInput, { paddingBottom: Math.max(spacing.md, tabBarHeight - spacing.xl) }]}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    ...typography.lg,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    ...typography.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  infoButton: {
    padding: spacing.sm,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    paddingBottom: spacing.xl,
  },
  chatInput: {},
});
