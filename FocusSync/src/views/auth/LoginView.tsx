import { ActionButton } from '@/src/components/ActionButton';
import { AppScreen } from '@/src/components/AppScreen';
import { useAuthController } from '@/src/controllers/useAuthController';
import { screenContent } from '@/src/models/screen';

export default function LoginView() {
  const { enterApp, openRegister } = useAuthController();
  return <AppScreen {...screenContent.login}><ActionButton label="Entrar" onPress={enterApp} /><ActionButton label="Crear una cuenta" onPress={openRegister} variant="secondary" /></AppScreen>;
}
