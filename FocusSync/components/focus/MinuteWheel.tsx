import React, { useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/theme';

const ROW_HEIGHT = 52;

interface NumberWheelProps {
  value: number;
  max: number;
  label: string;
  onChange: (value: number) => void;
  disabled: boolean;
}

function NumberWheel({ value, max, label, onChange, disabled }: NumberWheelProps) {
  const scroll = useRef<ScrollView>(null);
  const selected = useRef(value);
  const initialValue = useRef(value);
  useEffect(() => {
    if (selected.current === value) return;
    selected.current = value;
    scroll.current?.scrollTo({ y: value * ROW_HEIGHT, animated: false });
  }, [value]);
  const selectOffset = (offset: number) => {
    const next = Math.max(0, Math.min(max, Math.round(offset / ROW_HEIGHT)));
    if (next === selected.current) return;
    selected.current = next;
    onChange(next);
  };
  return (
    <View style={styles.column}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.wheel} accessible accessibilityRole="adjustable"
        accessibilityLabel={label} accessibilityHint="Desliza hacia arriba o abajo para elegir la duración"
        accessibilityValue={{ min: 0, max, now: value }} accessibilityState={{ disabled }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={({ nativeEvent }) => {
          if (disabled) return;
          onChange(Math.max(0, Math.min(max, value + (nativeEvent.actionName === 'increment' ? 1 : -1))));
        }}>
        <ScrollView ref={scroll} nestedScrollEnabled scrollEnabled={!disabled}
          showsVerticalScrollIndicator={false} contentContainerStyle={styles.numbers}
          contentOffset={{ x: 0, y: initialValue.current * ROW_HEIGHT }}
          snapToInterval={ROW_HEIGHT} decelerationRate="fast" bounces={false}
          overScrollMode="never" scrollEventThrottle={16}
          onScroll={({ nativeEvent }) => selectOffset(nativeEvent.contentOffset.y)}
          onMomentumScrollEnd={({ nativeEvent }) => selectOffset(nativeEvent.contentOffset.y)}>
          {Array.from({ length: max + 1 }, (_, number) => (
            <View key={number} style={styles.row}>
              <Text style={[styles.number, { opacity: Math.abs(number - value) > 1 ? 0.2 : 0.45 }, number === value && styles.selected]}>
                {String(number).padStart(2, '0')}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

interface MinuteWheelProps {
  value: number;
  onChange: (minutes: number) => void;
  disabled?: boolean;
}

export function MinuteWheel({ value, onChange, disabled = false }: MinuteWheelProps) {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return (
    <View style={[styles.container, disabled && styles.disabled]}>
      <NumberWheel label="Horas" value={hours} max={3} disabled={disabled} onChange={(next) => onChange(Math.min(180, next * 60 + minutes))} />
      <Text style={styles.separator}>:</Text>
      <NumberWheel key={hours === 3 ? 'maximum' : 'minutes'} label="Minutos" value={minutes} max={hours === 3 ? 0 : 59} disabled={disabled} onChange={(next) => onChange(hours * 60 + next)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', width: '100%', maxWidth: 340 },
  disabled: { opacity: 0.5 },
  column: { flex: 1, alignItems: 'center' },
  label: { color: colors.textSecondary, fontSize: 16, marginBottom: 12 },
  wheel: { height: ROW_HEIGHT * 5, width: '100%', overflow: 'hidden' },
  numbers: { paddingVertical: ROW_HEIGHT * 2 },
  row: { height: ROW_HEIGHT, alignItems: 'center', justifyContent: 'center' },
  number: { fontSize: 38, color: colors.textPrimary, fontVariant: ['tabular-nums'] },
  selected: { fontSize: 46, fontWeight: '600', opacity: 1 },
  separator: { color: colors.textPrimary, fontSize: 36, paddingTop: 32 },
});
