import { Pressable, StyleSheet, Text } from 'react-native';

type Props = { label: string; onPress: () => void; variant?: 'primary' | 'secondary' };

export function ActionButton({ label, onPress, variant = 'primary' }: Props) {
  const secondary = variant === 'secondary';
  return <Pressable style={[styles.button, secondary ? styles.secondary : styles.primary]} onPress={onPress}><Text style={[styles.text, secondary && styles.secondaryText]}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  button: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 12 },
  primary: { backgroundColor: '#6366F1' },
  secondary: { borderWidth: 1, borderColor: '#334155' },
  text: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  secondaryText: { color: '#CBD5E1' },
});
