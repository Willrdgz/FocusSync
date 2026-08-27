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

const getEdgeFunctionErrorMessage = async (error: unknown) => {
  if (typeof error === 'object' && error !== null && 'context' in error) {
    const context = (error as { context?: unknown }).context;

    if (context instanceof Response) {
      try {
        const payload = await context.clone().json();

        if (
          typeof payload === 'object' &&
          payload !== null &&
          'error' in payload &&
          typeof payload.error === 'string'
        ) {
          return payload.error;
        }
      } catch {
        try {
          const text = await context.clone().text();

          if (text.trim()) {
            return text.trim();
          }
        } catch {
          // Mantiene el fallback generico de abajo.
        }
      }
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'La IA Coach no pudo responder en este momento.';
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
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .order('block_order', { referencedTable: 'study_blocks', ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => mapStudyPlan(row as StudyPlanRow));
};

export const fetchStudyPlanById = async (id: string) => {
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
    .single();

  if (error) {
    throw error;
  }

  return mapStudyPlan(data as StudyPlanRow);
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
    .eq('id', sessionId);
};

export const resumeFocusSession = async (sessionId: string) => {
  const { error } = await supabase
    .from('focus_sessions')
    .update({
      status: 'en_ejecucion',
      paused_at: null,
    })
    .eq('id', sessionId);

  if (error) {
    throw error;
  }
};

export const cancelFocusSession = async (sessionId: string, realMinutes: number) => {
  const { error } = await supabase
    .from('focus_sessions')
    .update({
      status: 'cancelada',
      real_minutes: Math.max(0, realMinutes),
      finished_at: new Date().toISOString(),
    })
    .eq('id', sessionId);

  if (error) {
    throw error;
  }
};
