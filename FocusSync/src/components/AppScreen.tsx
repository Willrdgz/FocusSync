import { ReactNode } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { ScreenContent } from '@/src/models/screen';
import { BrandMark } from './BrandMark';

type Props = ScreenContent & { children?: ReactNode };

export function AppScreen({ eyebrow, title, description, children }: Props) {
  return <SafeAreaView style={styles.screen}><View style={styles.content}><BrandMark /><Text style={styles.eyebrow}>{eyebrow}</Text><Text style={styles.title}>{title}</Text><Text style={styles.description}>{description}</Text>{children}</View></SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0F172A' },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 28 },
  eyebrow: { color: '#818CF8', fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10 },
  title: { color: '#F8FAFC', fontSize: 34, lineHeight: 40, fontWeight: '800', marginBottom: 14 },
  description: { color: '#94A3B8', fontSize: 17, lineHeight: 26, marginBottom: 32 },
});
