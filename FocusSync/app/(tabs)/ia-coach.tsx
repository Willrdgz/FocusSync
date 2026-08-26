import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Keyboard, KeyboardAvoidingView, Platform, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, spacing, borderRadius, typography, fontWeights, shadows } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { MessageList } from '../../components/chat/MessageList';
import { ChatInput } from '../../components/chat/ChatInput';
import { mockMessages } from '../../constants/mockData';
import { ChatMessage } from '../../types';

export default function IACoachScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>(mockMessages);
  const [sending, setSending] = useState(false);
  const messageListRef = useRef<ScrollView>(null);

  const scrollToBottom = () => {
    if (messageListRef.current) {
      messageListRef.current.scrollToEnd({ animated: true });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (text: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setSending(true);

    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Entendido. Aquí tienes una propuesta:\n- Bloque 1 (45 min): Repaso de conceptos clave.\n- Descanso (10 min).\n- Bloque 2 (45 min): Ejercicios prácticos.',
        action: {
          label: 'Iniciar Bloque 1',
          screen: 'focus',
        },
      };
      setMessages((prev) => [...prev, aiResponse]);
      setSending(false);
    }, 1500);
  };

  const handleAction = (action: ChatMessage['action']) => {
    if (action?.screen === 'focus') {
      router.push('/(tabs)/focus');
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
            onAction={handleAction}
            style={styles.messageList}
            contentContainerStyle={styles.messageListContent}
          />

          <ChatInput
            onSend={handleSendMessage}
            disabled={sending}
            style={styles.chatInput}
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
