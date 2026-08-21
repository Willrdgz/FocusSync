import { AppScreen } from '@/src/components/AppScreen';
import { screenContent } from '@/src/models/screen';

export default function DashboardView() {
  return <AppScreen {...screenContent.dashboard} />;
}
