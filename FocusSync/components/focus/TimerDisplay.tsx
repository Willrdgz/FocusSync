import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors, typography, fontWeights } from '../../constants/theme';

interface TimerDisplayProps {
  timeRemaining: number;
  style?: any;
}

export const TimerDisplay = React.memo(({ timeRemaining, style }: TimerDisplayProps) => {
  const mins = Math.floor(timeRemaining / 60);
  const secs = timeRemaining % 60;
  const timeString = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  return (
    <Text style={[styles.timer, style]}>{timeString}</Text>
  );
});

TimerDisplay.displayName = 'TimerDisplay';

const styles = StyleSheet.create({
  timer: {
    fontSize: 88,
    fontWeight: '300',
    color: colors.textPrimary,
    fontFamily: 'monospace',
    letterSpacing: 4,
    textAlign: 'center',
  },
});