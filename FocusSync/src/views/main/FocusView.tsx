import { AppScreen } from '@/src/components/AppScreen';
import { screenContent } from '@/src/models/screen';

export default function FocusView() {
  return <AppScreen {...screenContent.focus} />;
}
