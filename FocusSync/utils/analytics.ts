export interface AnalyticsSession {
  id: string;
  realMinutes: number;
  status: string;
  startedAt: string;
  interruptionCount: number;
}

export interface WeeklyActivity {
  date: string;
  day: string;
  minutes: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: 'trophy-outline' | 'timer-outline' | 'flame-outline' | 'shield-checkmark-outline' | 'albums-outline';
  current: number;
  target: number;
  unit: string;
  unlocked: boolean;
  unlockedAt: string | null;
}

const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const localDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const buildWeeklyActivity = (sessions: AnalyticsSession[], today = new Date()): WeeklyActivity[] => {
  const minutesByDay = new Map<string, number>();

  sessions.forEach((session) => {
    const date = new Date(session.startedAt);
    const key = localDateKey(date);
    minutesByDay.set(key, (minutesByDay.get(key) ?? 0) + session.realMinutes);
  });

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    const key = localDateKey(date);

    return {
      date: key,
      day: DAY_LABELS[date.getDay()],
      minutes: minutesByDay.get(key) ?? 0,
    };
  });
};

export const calculateCurrentStreak = (sessions: AnalyticsSession[], today = new Date()) => {
  const completedDays = new Set(
    sessions
      .filter((session) => session.status === 'completada')
      .map((session) => localDateKey(new Date(session.startedAt))),
  );
  const cursor = new Date(today);
  cursor.setHours(0, 0, 0, 0);

  if (!completedDays.has(localDateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (completedDays.has(localDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
};

const findThresholdDate = (sessions: AnalyticsSession[], threshold: number) => {
  let accumulated = 0;
  const ordered = [...sessions].sort(
    (a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime(),
  );

  for (const session of ordered) {
    accumulated += session.realMinutes;
    if (accumulated >= threshold) return session.startedAt;
  }

  return null;
};

export const calculateAchievements = (
  sessions: AnalyticsSession[],
  planCount: number,
  currentStreak: number,
): Achievement[] => {
  const completed = sessions.filter((session) => session.status === 'completada');
  const totalMinutes = completed.reduce((total, session) => total + session.realMinutes, 0);
  const firstCompleted = [...completed].sort(
    (a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime(),
  )[0];
  const interruptionFree = completed.find((session) => session.interruptionCount === 0);

  return [
    {
      id: 'first-session',
      title: 'Primer paso',
      description: 'Completa tu primera sesión de enfoque.',
      icon: 'trophy-outline',
      current: Math.min(completed.length, 1),
      target: 1,
      unit: 'sesión',
      unlocked: completed.length >= 1,
      unlockedAt: firstCompleted?.startedAt ?? null,
    },
    {
      id: 'focused-hour',
      title: 'Una hora enfocada',
      description: 'Acumula 60 minutos de concentración.',
      icon: 'timer-outline',
      current: Math.min(totalMinutes, 60),
      target: 60,
      unit: 'min',
      unlocked: totalMinutes >= 60,
      unlockedAt: findThresholdDate(completed, 60),
    },
    {
      id: 'three-day-streak',
      title: 'Constancia',
      description: 'Mantén una racha de tres días.',
      icon: 'flame-outline',
      current: Math.min(currentStreak, 3),
      target: 3,
      unit: 'días',
      unlocked: currentStreak >= 3,
      unlockedAt: currentStreak >= 3 ? new Date().toISOString() : null,
    },
    {
      id: 'no-interruptions',
      title: 'Enfoque total',
      description: 'Completa una sesión sin interrupciones.',
      icon: 'shield-checkmark-outline',
      current: interruptionFree ? 1 : 0,
      target: 1,
      unit: 'sesión',
      unlocked: Boolean(interruptionFree),
      unlockedAt: interruptionFree?.startedAt ?? null,
    },
    {
      id: 'five-plans',
      title: 'Planificador',
      description: 'Crea cinco planes de estudio con la IA.',
      icon: 'albums-outline',
      current: Math.min(planCount, 5),
      target: 5,
      unit: 'planes',
      unlocked: planCount >= 5,
      unlockedAt: null,
    },
  ];
};
