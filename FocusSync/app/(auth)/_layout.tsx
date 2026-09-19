import { Redirect, Stack } from 'expo-router';
import { AuthStateView } from '../../components/auth/AuthStateView';
import { getAuthErrorMessage } from '../../utils/authErrors';
import { useAuth } from '../../hooks/useAuth';

export default function AuthLayout() {
  const { session, loading, authError, clearAuthError } = useAuth();

  if (loading) {
    return <AuthStateView />;
  }

  if (session) {
    return <Redirect href="/(tabs)/dashboard" />;
  }

  if (authError) {
    return (
      <AuthStateView
        title="No pudimos verificar tu sesión"
        message={getAuthErrorMessage(new Error(authError))}
        actionLabel="Intentar de nuevo"
        onAction={clearAuthError}
        loading={false}
      />
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
