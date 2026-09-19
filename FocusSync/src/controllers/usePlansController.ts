import { router } from 'expo-router';

export function usePlansController() {
  return {
    openPlan: (id = 'backend-php-postgresql') => router.push(`/plans/${id}`),
    returnToPlans: () => router.back(),
  };
}
