import { buildFeedbackMetrics } from './metrics.ts';
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.112.4';
import { AI_BUSY_MESSAGE, fetchGemini } from './gemini.ts';

const MODEL = 'gemini-3.6-flash';

export async function generateFeedback(client: SupabaseClient, userId: string, apiKey: string) {
  const since = new Date(Date.now() - 30 * 86400000).toISOString();
  const { data: sessions, error } = await client.from('focus_sessions')
    .select('id,status,planned_minutes,real_minutes,updated_at')
    .eq('user_id', userId).in('status', ['completada', 'cancelada'])
    .gte('finished_at', since).order('finished_at', { ascending: false }).limit(100);
  if (error) throw new Error('No se pudieron consultar tus métricas. Inténtalo de nuevo.');
  if (!sessions?.length) return { recommendation: null, empty: true };

  const [{ count, error: distractionsError }, { data: previous }] = await Promise.all([
    client.from('distractions').select('id', { count: 'exact', head: true })
      .eq('user_id', userId).in('session_id', sessions.map((session) => session.id)),
    client.from('ai_feedback').select('summary,recommendation,generated_at,total_sessions_analyzed,total_distractions_analyzed')
      .eq('user_id', userId).eq('ai_model', MODEL).order('generated_at', { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (distractionsError) throw new Error('No se pudieron consultar tus interrupciones. Inténtalo de nuevo.');
  const latestUpdate = Math.max(...sessions.map((session) => Date.parse(session.updated_at)));
  if (previous && Date.parse(previous.generated_at) > Math.max(latestUpdate, Date.now() - 15 * 60000)
    && previous.total_sessions_analyzed === sessions.length && previous.total_distractions_analyzed === count) {
    return { recommendation: previous.recommendation, generatedAt: previous.generated_at, cached: true };
  }
  const metrics = buildFeedbackMetrics(sessions, count ?? 0);
  const response = await fetchGemini(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: 'Eres el coach de estudio de FocusSync. Responde en español con JSON {"summary":"resumen breve","recommendation":"consejo de 2 frases, máximo 65 palabras"}. Basa el consejo exclusivamente en las métricas adjuntas, cita una cifra real y propone una acción concreta. Si hay muchas interrupciones o cancelaciones, sugiere bloques más cortos o reducir distracciones. Si hay buena continuidad, reconoce el progreso sin inventar logros. No infieras horarios, materias, diagnósticos ni causas que no consten en los datos. No confundas minutos estudiados con sesiones completadas.' }] },
      contents: [{ parts: [{ text: JSON.stringify(metrics) }] }],
      generationConfig: { responseMimeType: 'application/json' },
    }),
  });
  if (!response.ok) throw new Error(AI_BUSY_MESSAGE);
  const payload = await response.json();
  const result = JSON.parse(payload.candidates?.[0]?.content?.parts?.find((part: { text?: string; thought?: boolean }) => part.text && !part.thought)?.text ?? '{}');
  if (typeof result.summary !== 'string' || !result.summary.trim() || result.summary.length > 1000
    || typeof result.recommendation !== 'string' || !result.recommendation.trim() || result.recommendation.length > 700) {
    throw new Error('No se pudo generar tu consejo. Inténtalo de nuevo.');
  }
  const generatedAt = new Date().toISOString();
  const { error: saveError } = await client.from('ai_feedback').insert({
    user_id: userId, summary: result.summary, recommendation: result.recommendation,
    total_sessions_analyzed: sessions.length, total_distractions_analyzed: count ?? 0,
    ai_model: MODEL, generated_at: generatedAt,
  });
  if (saveError) console.error('Could not persist AI feedback', saveError.code);
  return { recommendation: result.recommendation, generatedAt, cached: false };
}
