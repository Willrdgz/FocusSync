import { Redirect } from 'expo-router';
import { AuthStateView } from '../components/auth/AuthStateView';
import { getAuthErrorMessage } from '../utils/authErrors';
import { useAuth } from '../hooks/useAuth';

export default function IndexRoute() {
  const { session, loading, authError, clearAuthError } = useAuth();

  if (loading) {
    return <AuthStateView />;
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

  return <Redirect href={session ? '/(tabs)/dashboard' : '/(auth)/login'} />;
}
