import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { colors, spacing, borderRadius, typography, fontWeights, shadows } from '../../constants/theme';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';

export default function LoginScreen() {
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateEmail = (email: string) => /\S+@\S+\.\S+/.test(email);

  const handleLogin = async () => {
    let hasError = false;
    if (!email.trim()) {
      setEmailError('El correo es requerido');
      hasError = true;
    } else if (!validateEmail(email)) {
      setEmailError('Correo inválido');
      hasError = true;
    } else {
      setEmailError('');
    }

    if (!password) {
      setPasswordError('La contraseña es requerida');
      hasError = true;
    } else if (password.length < 6) {
      setPasswordError('Mínimo 6 caracteres');
      hasError = true;
    } else {
      setPasswordError('');
    }

    if (hasError) return;

    setLoading(true);
    setFormError('');
    try {
      await login(email, password);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Credenciales inválidas';
      setFormError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setFormError('');
    try {
      await loginWithGoogle();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo iniciar sesión con Google';
      setFormError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Ionicons name="timer-outline" size={48} color={colors.primary} />
            </View>
            <Text style={styles.appName}>FocusSync</Text>
            <Text style={styles.tagline}>Concéntrate físicamente. Aprende inteligentemente.</Text>
          </View>

          <Card style={styles.formCard}>
            <Text style={styles.formTitle}>Iniciar sesión</Text>
            <Text style={styles.formSubtitle}>Accede a tu cuenta para continuar</Text>

            <View style={styles.inputGroup}>
              <Input
                label="Correo electrónico"
                placeholder="tu@email.com"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (emailError) setEmailError('');
                }}
                error={emailError}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
              <Input
                label="Contraseña"
                placeholder="••••••••"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (passwordError) setPasswordError('');
                }}
                error={passwordError}
                secureTextEntry
                autoComplete="password"
              />
            </View>

            <Button
              title="Iniciar Sesión"
              variant="primary"
              loading={loading}
              onPress={handleLogin}
              style={styles.primaryButton}
              fullWidth
            />

            {formError ? (
              <Text style={styles.formError}>{formError}</Text>
            ) : null}

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>o continúa con</Text>
              <View style={styles.dividerLine} />
            </View>

            <Button
              title="Continuar con Google"
              variant="secondary"
              loading={loading}
              onPress={handleGoogleLogin}
              style={styles.googleButton}
              fullWidth
              leftIcon={
                <FontAwesome name="google" size={20} color={colors.textPrimary} />
              }
            />
          </Card>

          <Text style={styles.footerText}>
            Al continuar, aceptas nuestros{' '}
            <Text style={styles.link}>Términos de Servicio</Text>{' '}
            y{' '}
            <Text style={styles.link}>Política de Privacidad</Text>
          </Text>

          <TouchableOpacity onPress={() => router.push('/(auth)/register')} style={styles.registerLink}>
            <Text style={styles.footerText}>¿No tienes cuenta? <Text style={styles.link}>Regístrate</Text></Text>
          </TouchableOpacity>
        </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    gap: spacing.xl,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  appName: {
    ...typography['3xl'],
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  tagline: {
    ...typography.md,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  formCard: {
    padding: spacing.xl,
  },
  formTitle: {
    ...typography.xl,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  formSubtitle: {
    ...typography.md,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  inputGroup: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  primaryButton: {
    marginBottom: spacing.lg,
  },
  formError: {
    ...typography.md,
    color: colors.danger,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    ...typography.sm,
    color: colors.textMuted,
  },
  googleButton: {
    marginBottom: spacing.xl,
  },
  footerText: {
    ...typography.sm,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  link: {
    color: colors.primary,
    fontWeight: fontWeights.medium,
  },
  registerLink: {
    alignItems: 'center',
  },
});
