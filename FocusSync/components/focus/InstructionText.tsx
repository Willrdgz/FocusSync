import React from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { colors, spacing, borderRadius, typography, fontWeights } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface InstructionTextProps {
  visible?: boolean;
}

export const InstructionText = ({ visible = true }: InstructionTextProps) => {
  const pulseAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [visible, pulseAnim]);

  const opacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  return (
    <Animated.View style={[styles.container, visible ? styles.visible : styles.hidden]}>
      <Animated.View style={{ opacity }}>
        <View style={styles.iconWrapper}>
          <Ionicons name="phone-portrait-outline" size={28} color={colors.primary} />
        </View>
        <Text style={styles.text}>
          Coloca el celular boca abajo para mantener el temporizador activo
        </Text>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    overflow: 'hidden',
  },
  visible: {
    opacity: 1,
    height: 'auto',
  },
  hidden: {
    opacity: 0,
    height: 0,
  },
  iconWrapper: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  text: {
    ...typography.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});