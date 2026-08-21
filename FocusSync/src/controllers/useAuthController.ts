import { router } from 'expo-router';

export function useAuthController() {
  return {
    enterApp: () => router.replace('/(tabs)'),
    openRegister: () => router.push('/(auth)/register'),
    returnToLogin: () => router.back(),
  };
}
