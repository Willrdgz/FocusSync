import { Session } from '../types';

export interface StudyAdvice {
  id: string;
  title: string;
  message: string;
}

interface AdviceMetrics {
  sessions: number;
  completed: number;
  totalMinutes: number;
  interruptions: number;
  interruptionFree: number;
  averageInterruptions: number;
  recentAverage: number;
  previousAverage: number;
  longestMinutes: number;
  activeDays: number;
}

type AdviceRule = (metrics: AdviceMetrics) => StudyAdvice | null;

const completedSessions = (sessions: Session[]) =>
  sessions.filter((session) => session.status === 'completada' || session.completed >= session.duration);

const getMetrics = (sessions: Session[]): AdviceMetrics => {
  const completed = completedSessions(sessions);
  const recent = sessions.slice(0, 5);
  const previous = sessions.slice(5, 10);
  const average = (items: Session[]) => items.length
    ? items.reduce((total, session) => total + session.interruptions, 0) / items.length
    : 0;

  return {
    sessions: sessions.length,
    completed: completed.length,
    totalMinutes: completed.reduce((total, session) => total + session.completed, 0),
    interruptions: sessions.reduce((total, session) => total + session.interruptions, 0),
    interruptionFree: completed.filter((session) => session.interruptions === 0).length,
    averageInterruptions: average(sessions),
    recentAverage: average(recent),
    previousAverage: average(previous),
    longestMinutes: completed.reduce((longest, session) => Math.max(longest, session.completed), 0),
    activeDays: new Set(sessions.map((session) => session.createdAt?.slice(0, 10)).filter(Boolean)).size,
  };
};

// Twenty local recommendations. Their order defines which achievement or improvement is highlighted first.
const ADVICE_RULES: AdviceRule[] = [
  (m) => m.sessions === 0 ? { id: 'first-session', title: 'Da el primer paso', message: 'Comienza con un bloque de 15 minutos. Una meta breve facilita crear el hábito sin sentir presión.' } : null,
  (m) => m.sessions >= 10 && m.previousAverage > 0 && m.recentAverage <= m.previousAverage * 0.5 ? { id: 'major-improvement', title: 'Gran mejora', message: `Bajaste de ${m.previousAverage.toFixed(1)} a ${m.recentAverage.toFixed(1)} interrupciones por sesión. Conserva la misma preparación antes de estudiar.` } : null,
  (m) => m.sessions >= 10 && m.recentAverage < m.previousAverage ? { id: 'improving', title: 'Vas mejorando', message: `Tus últimas sesiones tienen menos interrupciones: ${m.recentAverage.toFixed(1)} en promedio. Repite lo que te funcionó.` } : null,
  (m) => m.sessions >= 10 && m.recentAverage > m.previousAverage ? { id: 'recent-rise', title: 'Recupera tu enfoque', message: `Tus interrupciones recientes subieron a ${m.recentAverage.toFixed(1)} por sesión. Prueba un bloque más corto y deja listas tus herramientas antes de iniciar.` } : null,
  (m) => m.averageInterruptions >= 5 ? { id: 'many-interruptions', title: 'Reduce el bloque', message: `Promedias ${m.averageInterruptions.toFixed(1)} interrupciones por sesión. Prueba bloques de 15 minutos y aumenta la duración cuando logres dos sesiones limpias.` } : null,
  (m) => m.averageInterruptions >= 3 ? { id: 'medium-interruptions', title: 'Prepara tu entorno', message: `Promedias ${m.averageInterruptions.toFixed(1)} interrupciones. Antes de iniciar, activa No molestar y deja fuera de alcance lo que no necesites.` } : null,
  (m) => m.interruptions > 0 && m.averageInterruptions < 3 ? { id: 'few-interruptions', title: 'Estás cerca de una sesión limpia', message: `Tu promedio es de ${m.averageInterruptions.toFixed(1)} interrupciones. Identifica la primera causa y elimínala antes del próximo bloque.` } : null,
  (m) => m.interruptionFree >= 10 ? { id: 'ten-clean', title: 'Enfoque sobresaliente', message: `Ya completaste ${m.interruptionFree} sesiones sin interrupciones. Mantén ese ritual y aumenta el tiempo poco a poco.` } : null,
  (m) => m.interruptionFree >= 5 ? { id: 'five-clean', title: 'Tu concentración crece', message: `Llevas ${m.interruptionFree} sesiones sin interrupciones. Repite el entorno que usaste en ellas.` } : null,
  (m) => m.interruptionFree >= 1 && m.interruptionFree === m.completed ? { id: 'all-clean', title: 'Racha limpia', message: `Tus ${m.completed} sesiones completadas terminaron sin interrupciones. Sostén ese ritmo antes de alargar los bloques.` } : null,
  (m) => m.completed >= 20 ? { id: 'twenty-completed', title: 'Hábito consolidado', message: `Has completado ${m.completed} sesiones. Protege este hábito reservando una hora fija y preparando el espacio con anticipación.` } : null,
  (m) => m.completed >= 10 ? { id: 'ten-completed', title: 'Constancia comprobada', message: `Ya completaste ${m.completed} sesiones. Tu siguiente meta puede ser encadenar tres sesiones con cero interrupciones.` } : null,
  (m) => m.totalMinutes >= 600 ? { id: 'ten-hours', title: 'Diez horas de avance', message: `Acumulas ${Math.floor(m.totalMinutes / 60)} horas de enfoque. Conserva pausas breves para mantener la calidad de la concentración.` } : null,
  (m) => m.totalMinutes >= 300 ? { id: 'five-hours', title: 'Cinco horas enfocadas', message: `Ya sumaste ${Math.floor(m.totalMinutes / 60)} horas de estudio. Intenta que tu siguiente sesión termine sin levantar el teléfono.` } : null,
  (m) => m.totalMinutes >= 60 ? { id: 'first-hour', title: 'Primera hora lograda', message: `Acumulas ${m.totalMinutes} minutos de enfoque. Divide la siguiente hora en bloques cómodos con descansos definidos.` } : null,
  (m) => m.longestMinutes >= 60 ? { id: 'long-session', title: 'Cuida tu energía', message: `Tu sesión más larga fue de ${m.longestMinutes} minutos. Usa descansos programados para evitar que el cansancio se convierta en distracción.` } : null,
  (m) => m.activeDays >= 7 ? { id: 'seven-days', title: 'La constancia da resultado', message: `Tienes actividad en ${m.activeDays} días. Mantén una meta diaria pequeña para que el hábito sea sostenible.` } : null,
  (m) => m.completed >= 3 ? { id: 'three-completed', title: 'Construye una racha', message: `Completaste ${m.completed} sesiones. Busca que las próximas dos sean a la misma hora y con el teléfono boca abajo.` } : null,
  (m) => m.completed >= 1 && m.interruptions === 0 ? { id: 'first-clean', title: 'Excelente comienzo', message: 'Completaste tu estudio sin interrupciones. Repite la misma duración y el mismo entorno en tu próxima sesión.' } : null,
  (m) => m.completed >= 1 ? { id: 'first-completed', title: 'Objetivo cumplido', message: 'Ya completaste una sesión. Para mejorar, intenta reducir una interrupción en el próximo bloque.' } : null,
];

export const buildStudyAdvice = (sessions: Session[]): StudyAdvice => {
  const metrics = getMetrics(sessions);
  return ADVICE_RULES.map((rule) => rule(metrics)).find((advice): advice is StudyAdvice => Boolean(advice))
    ?? { id: 'keep-going', title: 'Sigue avanzando', message: 'Completa otra sesión para recibir un consejo basado en tu progreso.' };
};

export const STUDY_ADVICE_COUNT = ADVICE_RULES.length;
