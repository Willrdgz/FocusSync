import { supabase } from '../lib/supabase';
import { PlanDifficulty, StudyPlan, StudyPlanBlock, StudyBlockType } from '../types';
import { formatMinutes, getDifficultyLabel } from '../utils/studyPlanFormatters';

interface StudyBlockRow {
  id: string;
  title: string;
  description: string | null;
  block_type: StudyBlockType;
  duration_minutes: number;
  block_order: number;
  resources: unknown;
  steps: unknown;
}

interface StudyPlanRow {
  id: string;
  title: string;
  description: string | null;
  difficulty: PlanDifficulty;
  total_minutes: number;
  total_blocks: number;
  study_blocks?: StudyBlockRow[];
}

export interface GenerateStudyPlanResponse {
  message: string;
  plan: StudyPlan;
}

const studyPlanCache = new Map<string, StudyPlan>();

const getPlanCacheKey = (userId: string, planId: string) => `${userId}:${planId}`;

export const getCachedStudyPlan = (userId?: string, planId?: string) =>
  userId && planId ? studyPlanCache.get(getPlanCacheKey(userId, planId)) ?? null : null;

const requireAuthenticatedUser = async () => {
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    throw error ?? new Error('Debes iniciar sesion para consultar tus planes.');
  }

  return data.user;
};

const getEdgeFunctionErrorMessage = async (error: unknown) => {
  const fallback = 'No se pudo conectar con la IA. Inténtalo de nuevo en un momento.';
  if (typeof error === 'object' && error !== null && 'context' in error) {
    const context = (error as { context?: unknown }).context;
    if (context instanceof Response) {
      if (context.status === 401 || context.status === 403) return 'Tu sesión venció. Inicia sesión nuevamente.';
      try {
        const payload = await context.clone().json();
        const message = typeof payload?.error === 'string' ? payload.error : '';
        if (/503|429|high demand|UNAVAILABLE|ocupada/.test(message) || context.status === 503) {
          return 'La IA está ocupada en este momento. Espera un momento y vuelve a intentarlo.';
        }
      } catch { /* Nunca mostrar respuestas técnicas al usuario. */ }
    }
  }
  return fallback;
};

export interface HistoryFeedback {
  recommendation: string | null;
  generatedAt?: string;
  empty?: boolean;
}

export const fetchHistoryFeedback = async (): Promise<HistoryFeedback> => {
  const { data, error } = await supabase.functions.invoke<HistoryFeedback>('generate-study-plan', {
    body: { action: 'feedback' },
  });
  if (error) throw new Error(await getEdgeFunctionErrorMessage(error));
  if (!data || (!data.empty && typeof data.recommendation !== 'string')) {
    throw new Error('No se pudo generar tu consejo. Inténtalo de nuevo.');
  }
  return data;
};

const normalizeStringArray = (value: unknown) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === 'string');
};

export const mapStudyPlan = (row: StudyPlanRow): StudyPlan => {
  const blocks = [...(row.study_blocks ?? [])]
    .sort((a, b) => a.block_order - b.block_order)
    .map<StudyPlanBlock>((block) => ({
      id: block.id,
      title: block.title,
      description: block.description,
      type: block.block_type,
      duration: formatMinutes(block.duration_minutes),
      durationMinutes: block.duration_minutes,
      resources: normalizeStringArray(block.resources),
      steps: normalizeStringArray(block.steps),
    }));

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    difficulty: row.difficulty,
    difficultyLabel: getDifficultyLabel(row.difficulty),
    totalTime: formatMinutes(row.total_minutes),
    totalMinutes: row.total_minutes,
    blocks,
  };
};

export const generateStudyPlan = async (prompt: string) => {
  const { data, error } = await supabase.functions.invoke<GenerateStudyPlanResponse>('generate-study-plan', {
    body: { prompt },
  });

  if (error) {
    throw new Error(await getEdgeFunctionErrorMessage(error));
  }

  if (!data?.plan) {
    throw new Error('La API no devolvio un plan de estudio valido.');
  }

  return data;
};

export const fetchStudyPlans = async () => {
  const user = await requireAuthenticatedUser();
  const { data, error } = await supabase
    .from('study_plans')
    .select(
      `
        id,
        title,
        description,
        difficulty,
        total_minutes,
        total_blocks,
        study_blocks (
          id,
          title,
          description,
          block_type,
          duration_minutes,
          block_order,
          resources,
          steps
        )
      `,
    )
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .order('block_order', { referencedTable: 'study_blocks', ascending: true });

  if (error) {
    throw error;
  }

  const plans = (data ?? []).map((row) => mapStudyPlan(row as StudyPlanRow));

  plans.forEach((plan) => studyPlanCache.set(getPlanCacheKey(user.id, plan.id), plan));

  return plans;
};

export const fetchStudyPlanById = async (id: string) => {
  const user = await requireAuthenticatedUser();
  const { data, error } = await supabase
    .from('study_plans')
    .select(
      `
        id,
        title,
        description,
        difficulty,
        total_minutes,
        total_blocks,
        study_blocks (
          id,
          title,
          description,
          block_type,
          duration_minutes,
          block_order,
          resources,
          steps
        )
      `,
    )
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) {
    throw error;
  }

  const plan = mapStudyPlan(data as StudyPlanRow);

  studyPlanCache.set(getPlanCacheKey(user.id, plan.id), plan);

  return plan;
};

export const createFocusSession = async ({
  planId,
  blockId,
  plannedMinutes,
}: {
  planId?: string;
  blockId?: string;
  plannedMinutes: number;
}) => {
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    throw userError ?? new Error('Debes iniciar sesion para guardar la sesion.');
  }

  const { data, error } = await supabase
    .from('focus_sessions')
    .insert({
      user_id: userData.user.id,
      plan_id: planId || null,
      block_id: blockId || null,
      planned_minutes: plannedMinutes,
      status: 'en_ejecucion',
    })
    .select('id')
    .single();

  if (error) {
    throw error;
  }

  return data.id as string;
};

export const recordDistraction = async ({
  sessionId,
  elapsedSeconds,
  sensorPayload,
}: {
  sessionId: string;
  elapsedSeconds: number;
  sensorPayload?: Record<string, unknown>;
}) => {
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    throw userError ?? new Error('Debes iniciar sesion para registrar distracciones.');
  }

  const { error: distractionError } = await supabase.from('distractions').insert({
    user_id: userData.user.id,
    session_id: sessionId,
    distraction_type: 'dispositivo_levantado',
    description: 'El dispositivo fue levantado durante un bloque de enfoque.',
    sensor_payload: {
      source: 'expo_sensors',
      elapsed_seconds: elapsedSeconds,
      ...sensorPayload,
    },
  });

  if (distractionError) {
    throw distractionError;
  }

  await supabase
    .from('focus_sessions')
    .update({
      status: 'pausada',
      paused_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .eq('user_id', userData.user.id);
};

export const resumeFocusSession = async (sessionId: string) => {
  const user = await requireAuthenticatedUser();
  const { error } = await supabase
    .from('focus_sessions')
    .update({
      status: 'en_ejecucion',
      paused_at: null,
    })
    .eq('id', sessionId)
    .eq('user_id', user.id);

  if (error) {
    throw error;
  }
};

export const cancelFocusSession = async (sessionId: string, realMinutes: number) => {
  const user = await requireAuthenticatedUser();
  const { error } = await supabase
    .from('focus_sessions')
    .update({
      status: 'cancelada',
      real_minutes: Math.max(0, realMinutes),
      finished_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .eq('user_id', user.id);

  if (error) {
    throw error;
  }
};

export const completeFocusSession = async (sessionId: string, realMinutes: number) => {
  const user = await requireAuthenticatedUser();
  const { error } = await supabase
    .from('focus_sessions')
    .update({
      status: 'completada',
      real_minutes: Math.max(0, realMinutes),
      finished_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .eq('user_id', user.id);

  if (error) throw error;
};
