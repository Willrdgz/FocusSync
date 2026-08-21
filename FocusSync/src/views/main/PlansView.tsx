import { ActionButton } from '@/src/components/ActionButton';
import { AppScreen } from '@/src/components/AppScreen';
import { usePlansController } from '@/src/controllers/usePlansController';
import { screenContent } from '@/src/models/screen';

export default function PlansView() {
  const { openPlan } = usePlansController();
  return <AppScreen {...screenContent.plans}><ActionButton label="Ver plan de ejemplo" onPress={openPlan} /></AppScreen>;
}
