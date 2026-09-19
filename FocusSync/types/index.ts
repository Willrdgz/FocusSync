import type React from 'react';
import type { StyleProp, TextInputProps, ViewStyle } from 'react-native';
import type { Ionicons } from '@expo/vector-icons';

export interface User {
  email: string;
  name: string;
}

export type StudyBlockType = 'teoria' | 'practica' | 'descanso';
export type PlanDifficulty = 'basico' | 'intermedio' | 'avanzado' | 'dificil';

export interface Session {
  id: string;
  subject: string;
  duration: number;
  completed: number;
  interruptions: number;
  plannedDuration?: number;
  actualDuration?: number;
}

export interface DailyActivity {
  id: string;
  time: string;
  title: string;
  duration: string;
  status: 'completed' | 'upcoming' | 'pending';
}

export interface StudyPlanBlock {
  id: string;
  title: string;
  description?: string | null;
  duration: string;
  durationMinutes: number;
  type: StudyBlockType;
  resources: string[];
  steps: string[];
}

export interface StudyPlan {
  id: string;
  title: string;
  description?: string | null;
  difficulty: PlanDifficulty;
  difficultyLabel: string;
  totalTime: string;
  totalMinutes: number;
  blocks: StudyPlanBlock[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  plan?: StudyPlan;
  action?: {
    label: string;
    screen: string;
    planId?: string;
    blockId?: string;
    durationMinutes?: number;
  };
}

export interface MetricCardProps {
  label: string;
  value: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  style?: StyleProp<ViewStyle>;
}

export interface SessionCardProps {
  session: Session;
}

export interface ButtonProps {
  title?: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'google';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export interface InputProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  label?: string;
  error?: string;
  style?: StyleProp<ViewStyle>;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'visible-password';
  autoComplete?: TextInputProps['autoComplete'];
}

export interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}

export interface BadgeProps {
  text: string;
  variant?: 'success' | 'danger' | 'warning' | 'info';
  style?: any;
}

export interface ProgressRingProps {
  progress?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  children?: React.ReactNode;
  style?: any;
}

export interface ModalProps {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

export interface ChatBubbleProps {
  message: ChatMessage;
  onAction?: (action: ChatMessage['action']) => void;
}

export interface MessageListProps {
  messages: ChatMessage[];
  onAction?: (action: ChatMessage['action']) => void;
  style?: any;
}

export interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  style?: any;
}
