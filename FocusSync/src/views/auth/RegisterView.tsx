import { ActionButton } from '@/src/components/ActionButton';
import { AppScreen } from '@/src/components/AppScreen';
import { useAuthController } from '@/src/controllers/useAuthController';
import { screenContent } from '@/src/models/screen';

export default function RegisterView() {
  const { enterApp, returnToLogin } = useAuthController();
  return <AppScreen {...screenContent.register}><ActionButton label="Crear cuenta" onPress={enterApp} /><ActionButton label="Ya tengo una cuenta" onPress={returnToLogin} variant="secondary" /></AppScreen>;
}
