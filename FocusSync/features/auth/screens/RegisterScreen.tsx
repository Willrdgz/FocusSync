import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { borderRadius, colors, fontWeights, shadows, spacing, typography } from '../../../constants/theme';
import { useAuth } from '../../../hooks/useAuth';

export function RegisterScreen() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || password.length < 6) {
      Alert.alert('Datos incompletos', 'Ingresa nombre, correo y una contraseña de al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      await register(email, password, name);
    } catch {
      Alert.alert('Error', 'No se pudo crear la cuenta simulada.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Ionicons name="person-add-outline" size={44} color={colors.primary} />
            </View>
            <Text style={styles.appName}>Crear cuenta</Text>
            <Text style={styles.tagline}>Vincula tus planes y registros a tu perfil personal.</Text>
          </View>

          <Card style={styles.formCard}>
            <Input label="Nombre" placeholder="Tu nombre" value={name} onChangeText={setName} autoComplete="name" />
            <Input label="Correo electrónico" placeholder="tu@email.com" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
            <Input label="Contraseña" placeholder="••••••••" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" />
            <Button title="Registrarme" loading={loading} onPress={handleRegister} fullWidth />
          </Card>

          <TouchableOpacity onPress={() => router.replace('/(auth)/login')} style={styles.loginLink}>
            <Text style={styles.footerText}>¿Ya tienes cuenta? <Text style={styles.link}>Inicia sesión</Text></Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  keyboardView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  logoContainer: { alignItems: 'center', gap: spacing.md },
  logo: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  appName: { ...typography['3xl'], fontWeight: fontWeights.bold, color: colors.textPrimary },
  tagline: { ...typography.md, color: colors.textMuted, textAlign: 'center' },
  formCard: { gap: spacing.md, padding: spacing.xl },
  loginLink: { alignItems: 'center' },
  footerText: { ...typography.sm, color: colors.textMuted, textAlign: 'center' },
  link: { color: colors.primary, fontWeight: fontWeights.semibold },
});
