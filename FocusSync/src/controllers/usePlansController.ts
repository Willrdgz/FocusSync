import { router } from 'expo-router';

export function usePlansController() {
  return {
    openPlan: () => router.push('/plans'),
    returnToPlans: () => router.back(),
  };
}
