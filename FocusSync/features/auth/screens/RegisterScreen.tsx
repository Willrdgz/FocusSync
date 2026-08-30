import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
  const [formNotice, setFormNotice] = useState<{ message: string; type: 'error' | 'info' } | null>(null);

  const handleRegister = async () => {
    setFormNotice(null);

    if (!name.trim() || !email.trim() || password.length < 6) {
      setFormNotice({ message: 'Ingresa nombre, correo y una contraseña de al menos 6 caracteres.', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const result = await register(email, password, name);
      if (result.requiresEmailConfirmation) {
        setFormNotice({
          message: `Revisa tu correo: te enviamos un enlace de confirmación a ${email}.`,
          type: 'info',
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo crear la cuenta.';
      setFormNotice({ message, type: 'error' });
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

            {formNotice ? (
              <Text style={formNotice.type === 'error' ? styles.errorText : styles.infoText}>{formNotice.message}</Text>
            ) : null}
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
  errorText: {
    ...typography.md,
    color: colors.danger,
    textAlign: 'center',
  },
  infoText: {
    ...typography.md,
    color: colors.success,
    textAlign: 'center',
  },
  loginLink: { alignItems: 'center' },
  footerText: { ...typography.sm, color: colors.textMuted, textAlign: 'center' },
  link: { color: colors.primary, fontWeight: fontWeights.semibold },
});
