import { Redirect, Stack } from 'expo-router';
import { AuthStateView } from '../../components/auth/AuthStateView';
import { colors } from '../../constants/theme';
import { getAuthErrorMessage } from '../../utils/authErrors';
import { useAuth } from '../../hooks/useAuth';

export default function PlansLayout() {
  const { session, loading, authError, clearAuthError } = useAuth();

  if (loading) {
    return <AuthStateView />;
  }

  if (authError) {
    return (
      <AuthStateView
        title="No pudimos verificar tu sesión"
        message={getAuthErrorMessage(new Error(authError))}
        actionLabel="Volver a intentar"
        onAction={clearAuthError}
        loading={false}
      />
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}
