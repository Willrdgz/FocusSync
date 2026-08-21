import { AppScreen } from '@/src/components/AppScreen';
import { screenContent } from '@/src/models/screen';

export default function HistoryView() {
  return <AppScreen {...screenContent.history} />;
}
