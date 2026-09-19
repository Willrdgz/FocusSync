export function getAuthErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return 'Ocurrio un error inesperado. Intenta nuevamente.';
  }

  const message = error.message.toLowerCase();

  if (message.includes('invalid login credentials')) {
    return 'Correo o contrasena incorrectos.';
  }

  if (message.includes('email not confirmed') || message.includes('email not verified')) {
    return 'Debes verificar tu correo antes de iniciar sesion.';
  }

  if (message.includes('user already registered') || message.includes('already registered')) {
    return 'Este correo ya esta registrado. Intenta iniciar sesion.';
  }

  if (message.includes('signup disabled')) {
    return 'El registro de nuevos usuarios esta deshabilitado en Supabase.';
  }

  if (message.includes('password should be at least') || message.includes('weak password')) {
    return 'La contrasena no cumple los requisitos minimos.';
  }

  if (message.includes('unable to validate email address') || message.includes('invalid email')) {
    return 'Ingresa un correo electronico valido.';
  }

  if (message.includes('database error saving new user')) {
    return 'No se pudo crear tu perfil. Revisa la configuracion de la base de datos.';
  }

  if (message.includes('network request failed') || message.includes('fetch')) {
    return 'No se pudo conectar con Supabase. Revisa tu conexion e intenta nuevamente.';
  }

  return 'No pudimos completar la operacion. Intenta nuevamente.';
}
