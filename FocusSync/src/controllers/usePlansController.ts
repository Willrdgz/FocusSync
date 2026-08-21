import { router } from 'expo-router';

export function usePlansController() {
  return {
    openPlan: () => router.push('/(tabs)/plan-detail'),
    returnToPlans: () => router.back(),
  };
}
