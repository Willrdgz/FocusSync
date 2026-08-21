import { AppScreen } from '@/src/components/AppScreen';
import { screenContent } from '@/src/models/screen';

export default function CoachView() {
  return <AppScreen {...screenContent.coach} />;
}
