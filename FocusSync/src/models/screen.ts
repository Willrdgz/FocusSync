export type ScreenContent = {
  eyebrow: string;
  title: string;
  description: string;
};

export const screenContent = {
  login: { eyebrow: 'Bienvenido', title: 'Iniciar sesión', description: 'Accede a tus planes de estudio y sesiones de enfoque.' },
  register: { eyebrow: 'Nueva cuenta', title: 'Registrarse', description: 'Crea tu perfil para guardar planes, avances y recomendaciones.' },
  dashboard: { eyebrow: 'FocusSync', title: 'Dashboard', description: 'Resumen diario de tiempo enfocado, distracciones, racha y próximas actividades.' },
  coach: { eyebrow: 'Planificador inteligente', title: 'IA Coach', description: 'Aquí el estudiante solicitará un plan y recibirá bloques de estudio personalizados.' },
  focus: { eyebrow: 'Temporizador e IoT', title: 'Modo enfoque', description: 'Esta pantalla mostrará la cuenta regresiva y el estado de los sensores del teléfono.' },
  plans: { eyebrow: 'Biblioteca', title: 'Planes de estudio', description: 'Listado de planes guardados, duración, dificultad y cantidad de bloques.' },
  planDetail: { eyebrow: 'Detalle', title: 'Plan de estudio', description: 'Distribución de materias, recursos, actividades y descansos del plan seleccionado.' },
  history: { eyebrow: 'Analítica', title: 'Historial', description: 'Registro de sesiones, tiempo real estudiado, interrupciones y recomendaciones.' },
} satisfies Record<string, ScreenContent>;
