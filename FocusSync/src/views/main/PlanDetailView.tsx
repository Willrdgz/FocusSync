import { ActionButton } from '@/src/components/ActionButton';
import { AppScreen } from '@/src/components/AppScreen';
import { usePlansController } from '@/src/controllers/usePlansController';
import { screenContent } from '@/src/models/screen';

export default function PlanDetailView() {
  const { returnToPlans } = usePlansController();
  return <AppScreen {...screenContent.planDetail}><ActionButton label="Volver a planes" onPress={returnToPlans} variant="secondary" /></AppScreen>;
}
