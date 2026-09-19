import { ChatMessage, DailyActivity, Session as SessionType, StudyPlan } from '../types';

export const mockUser = {
  email: 'usuario@ejemplo.com',
  name: 'Estudiante',
};

export const mockSessions: SessionType[] = [
  {
    id: '1',
    subject: 'Algoritmos',
    duration: 45,
    completed: 45,
    interruptions: 0,
    plannedDuration: 45,
    actualDuration: 45,
  },
  {
    id: '2',
    subject: 'Termodinámica',
    duration: 45,
    completed: 20,
    interruptions: 2,
    plannedDuration: 45,
    actualDuration: 20,
  },
  {
    id: '3',
    subject: 'Cálculo',
    duration: 60,
    completed: 60,
    interruptions: 1,
    plannedDuration: 60,
    actualDuration: 64,
  },
  {
    id: '4',
    subject: 'Física Cuántica',
    duration: 30,
    completed: 30,
    interruptions: 0,
    plannedDuration: 30,
    actualDuration: 30,
  },
];

export const mockDailyActivities: DailyActivity[] = [
  { id: '1', time: '08:00', title: 'Lectura de algoritmos', duration: '45 min', status: 'completed' },
  { id: '2', time: '10:00', title: 'Práctica de termodinámica', duration: '45 min', status: 'upcoming' },
  { id: '3', time: '16:30', title: 'Repaso guiado por IA', duration: '30 min', status: 'pending' },
];

export const mockStudyPlans: StudyPlan[] = [
  {
    id: 'backend-php-postgresql',
    title: 'Backend PHP & PostgreSQL',
    difficulty: 'avanzado',
    difficultyLabel: 'Avanzado',
    totalTime: '2h 30m',
    totalMinutes: 150,
    blocks: [
      {
        id: 'b1',
        title: 'Fundamentos de arquitectura backend',
        description: 'Repaso de conceptos base para estructurar servicios backend.',
        duration: '45 min',
        durationMinutes: 45,
        type: 'teoria',
        resources: ['Apuntes de arquitectura MVC', 'Documentación oficial de PHP'],
        steps: ['Repasar separación de responsabilidades', 'Identificar entidades principales', 'Definir endpoints base'],
      },
      {
        id: 'b2',
        title: 'Modelado relacional en PostgreSQL',
        description: 'Practica de modelado e implementacion de relaciones.',
        duration: '45 min',
        durationMinutes: 45,
        type: 'practica',
        resources: ['PgAdmin o psql', 'Diagrama entidad-relación'],
        steps: ['Crear tablas principales', 'Definir claves foráneas', 'Probar consultas SELECT y JOIN'],
      },
      {
        id: 'b3',
        title: 'Descanso activo',
        description: 'Pausa breve para recuperar atencion.',
        duration: '10 min',
        durationMinutes: 10,
        type: 'descanso',
        resources: ['Agua', 'Cronómetro'],
        steps: ['Alejarse de la pantalla', 'Estirar cuello y manos'],
      },
    ],
  },
  {
    id: 'algoritmos-estructuras',
    title: 'Algoritmos y Estructuras de Datos',
    difficulty: 'intermedio',
    difficultyLabel: 'Intermedio',
    totalTime: '1h 40m',
    totalMinutes: 100,
    blocks: [
      {
        id: 'a1',
        title: 'Complejidad temporal',
        description: 'Repaso teorico de notacion Big-O.',
        duration: '40 min',
        durationMinutes: 40,
        type: 'teoria',
        resources: ['Tabla Big-O', 'Cuaderno de ejercicios'],
        steps: ['Comparar O(n), O(log n) y O(n²)', 'Resolver tres ejemplos guiados'],
      },
      {
        id: 'a2',
        title: 'Ejercicios con listas y pilas',
        description: 'Practica guiada con estructuras lineales.',
        duration: '50 min',
        durationMinutes: 50,
        type: 'practica',
        resources: ['Editor de código', 'Set de problemas'],
        steps: ['Implementar stack', 'Resolver validación de paréntesis', 'Medir tiempos de ejecución'],
      },
    ],
  },
  {
    id: 'fisica-cuantica-base',
    title: 'Física Cuántica Base',
    difficulty: 'dificil',
    difficultyLabel: 'Dificil',
    totalTime: '3h',
    totalMinutes: 180,
    blocks: [
      {
        id: 'q1',
        title: 'Postulados y notación',
        description: 'Revision de fundamentos conceptuales y matematicos.',
        duration: '60 min',
        durationMinutes: 60,
        type: 'teoria',
        resources: ['Libro guía', 'Formulario matemático'],
        steps: ['Repasar vectores de estado', 'Resolver ejercicios de notación bra-ket'],
      },
    ],
  },
];

export const mockMessages: ChatMessage[] = [
  {
    id: '1',
    role: 'user',
    content: 'Tengo 2 horas libres, necesito estudiar algoritmos y termodinámica',
  },
  {
    id: '2',
    role: 'assistant',
    content: 'Aquí tienes tu plan:\n- Bloque 1 (45 min): Teoría de algoritmos.\n- Descanso (10 min).\n- Bloque 2 (45 min): Práctica de termodinámica.',
    action: {
      label: 'Iniciar Bloque 1',
      screen: 'focus',
    },
  },
];

export const mockDashboardMetrics = {
  focusedTime: '3h 15m',
  distractions: '2 interrupciones',
  streak: '4 días',
  dailyGoal: 80,
};

export const mockNextSession = {
  subject: 'Repaso de algoritmos',
  duration: '45 min',
};

export const mockAIFeedback = 'He notado que tus sesiones de la tarde tienen más distracciones. Intenta acortar los bloques a 25 minutos.';
