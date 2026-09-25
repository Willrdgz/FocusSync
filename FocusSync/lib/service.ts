import { supabase } from './supabase';
import { Session } from '../types';
import { Achievement, AnalyticsSession, WeeklyActivity, buildWeeklyActivity, calculateAchievements, calculateCurrentStreak } from '../utils/analytics';

export type FocusStatus = 'completed' | 'interrupted';
export type DistractionType = 'dispositivo_levantado' | 'movimiento_detectado' | 'orientacion_incorrecta';

async function getUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id ?? null;
}

export async function startFocusSession(plannedMinutes: number): Promise<{ id: string }> {
  const userId = await getUserId();
  if (!userId) throw new Error('No hay sesión de usuario activa');

  const { data, error } = await supabase
    .from('focus_sessions')
    .insert({ user_id: userId, planned_minutes: plannedMinutes, status: 'en_ejecucion' })
    .select('id')
    .single();

  if (error) throw error;
  return data as { id: string };
}

export async function insertDistraction(
  sessionId: string,
  distractionType: DistractionType = 'dispositivo_levantado'
): Promise<void> {
  const userId = await getUserId();
  if (!userId) throw new Error('No hay sesión de usuario activa');

  const { error } = await supabase
    .from('distractions')
    .insert({ session_id: sessionId, user_id: userId, distraction_type: distractionType });

  if (error) throw error;
}

export async function finishFocusSession(
  sessionId: string,
  input: { realMinutes: number; status: FocusStatus }
): Promise<void> {
  const userId = await getUserId();
  if (!userId) throw new Error('No hay sesión de usuario activa');

  const { error } = await supabase
    .from('focus_sessions')
    .update({
      real_minutes: input.realMinutes,
      status: input.status === 'completed' ? 'completada' : 'cancelada',
      finished_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .eq('user_id', userId);

  if (error) throw error;
}

interface FocusSessionRow {
  id: string;
  planned_minutes: number;
  real_minutes: number;
  status: string;
  started_at: string;
  finished_at: string | null;
  study_blocks: { title: string } | { title: string }[] | null;
}

function getBlockTitle(blocks: FocusSessionRow['study_blocks']): string | null {
  if (!blocks) return null;
  if (Array.isArray(blocks)) return blocks[0]?.title ?? null;
  return blocks.title;
}

export async function fetchFocusSessions(): Promise<Session[]> {
  const userId = await getUserId();
  if (!userId) throw new Error('No hay sesión de usuario activa');

  const { data, error } = await supabase
    .from('focus_sessions')
    .select('id, planned_minutes, real_minutes, status, started_at, finished_at, study_blocks(title)')
    .eq('user_id', userId)
    .order('started_at', { ascending: false });

  if (error) throw error;

  const rows = (data ?? []) as FocusSessionRow[];

  const { data: distractionRows } = await supabase
    .from('distractions')
    .select('session_id')
    .eq('user_id', userId);
  const interruptionCounts: Record<string, number> = {};
  for (const row of distractionRows ?? []) {
    interruptionCounts[row.session_id] = (interruptionCounts[row.session_id] ?? 0) + 1;
  }

  return rows.map((row) => ({
    id: row.id,
    subject: getBlockTitle(row.study_blocks) ?? 'Sesión de enfoque',
    duration: row.planned_minutes,
    completed: row.real_minutes,
    interruptions: interruptionCounts[row.id] ?? 0,
    plannedDuration: row.planned_minutes,
    actualDuration: row.real_minutes,
    createdAt: row.started_at,
  }));
}

export interface DashboardSummary {
  focusedMinutesToday: number;
  sessionsToday: number;
  distractionsToday: number;
  currentStreak: number;
  dailyGoalMinutes: number;
  weeklyActivity: WeeklyActivity[];
  achievements: Achievement[];
}

export async function fetchDashboardSummary(): Promise<DashboardSummary | null> {
  const userId = await getUserId();
  if (!userId) throw new Error('No hay sesión de usuario activa');

  const [profileResult, sessionsResult, distractionsResult, plansResult] = await Promise.all([
    supabase.from('profiles').select('daily_goal_minutes').eq('id', userId).single(),
    supabase
      .from('focus_sessions')
      .select('id, real_minutes, status, started_at')
      .eq('user_id', userId),
    supabase
      .from('distractions')
      .select('id, session_id, detected_at')
      .eq('user_id', userId),
    supabase.from('study_plans').select('id', { count: 'exact', head: true }).eq('user_id', userId),
  ]);

  if (profileResult.error) throw profileResult.error;
  if (sessionsResult.error) throw sessionsResult.error;
  if (distractionsResult.error) throw distractionsResult.error;
  if (plansResult.error) throw plansResult.error;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const interruptionCounts = new Map<string, number>();
  (distractionsResult.data ?? []).forEach((distraction) => {
    interruptionCounts.set(distraction.session_id, (interruptionCounts.get(distraction.session_id) ?? 0) + 1);
  });

  const analyticsSessions: AnalyticsSession[] = (sessionsResult.data ?? []).map((session) => ({
    id: session.id,
    realMinutes: session.real_minutes ?? 0,
    status: session.status,
    startedAt: session.started_at,
    interruptionCount: interruptionCounts.get(session.id) ?? 0,
  }));
  const todaySessions = analyticsSessions.filter(
    (session) => new Date(session.startedAt).getTime() >= startOfToday.getTime(),
  );
  const distractionsToday = (distractionsResult.data ?? []).filter(
    (distraction) => new Date(distraction.detected_at).getTime() >= startOfToday.getTime(),
  ).length;
  const currentStreak = calculateCurrentStreak(analyticsSessions);

  const focusedMinutesToday = todaySessions.reduce(
    (total, session) => total + session.realMinutes,
    0,
  );

  return {
    focusedMinutesToday,
    sessionsToday: todaySessions.length,
    distractionsToday,
    currentStreak,
    dailyGoalMinutes: profileResult.data.daily_goal_minutes ?? 120,
    weeklyActivity: buildWeeklyActivity(analyticsSessions),
    achievements: calculateAchievements(
      analyticsSessions,
      plansResult.count ?? 0,
      currentStreak,
    ),
  };
}

export function formatMinutes(totalMinutes: number): string {
  if (totalMinutes <= 0) return '0m';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}
