import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.112.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GeminiPlanBlock {
  title: string;
  description: string;
  block_type: 'teoria' | 'practica' | 'descanso';
  duration_minutes: number;
  resources: string[];
  steps: string[];
}

interface GeminiPlan {
  title: string;
  description: string;
  difficulty: 'basico' | 'intermedio' | 'avanzado' | 'dificil';
  total_minutes: number;
  blocks: GeminiPlanBlock[];
}

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const getFirstSecretValue = (jsonValue: string | undefined) => {
  if (!jsonValue) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(jsonValue) as Record<string, unknown>;
    const firstValue = Object.values(parsed).find((value) => typeof value === 'string');

    return typeof firstValue === 'string' ? firstValue : undefined;
  } catch {
    return undefined;
  }
};

const parseGeminiJson = (text: string): GeminiPlan => {
  const cleaned = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  return JSON.parse(cleaned) as GeminiPlan;
};

const normalizePlan = (plan: GeminiPlan): GeminiPlan => {
  const blocks = Array.isArray(plan.blocks) ? plan.blocks : [];
  const safeBlocks = blocks.slice(0, 8).map((block) => ({
    title: block.title || 'Bloque de estudio',
    description: block.description || '',
    block_type: ['teoria', 'practica', 'descanso'].includes(block.block_type) ? block.block_type : 'practica',
    duration_minutes: Math.max(5, Math.min(Number(block.duration_minutes) || 25, 120)),
    resources: Array.isArray(block.resources) ? block.resources.filter((item) => typeof item === 'string') : [],
    steps: Array.isArray(block.steps) ? block.steps.filter((item) => typeof item === 'string') : [],
  }));

  const totalMinutes = safeBlocks.reduce((total, block) => total + block.duration_minutes, 0);

  return {
    title: plan.title || 'Plan de estudio personalizado',
    description: plan.description || 'Plan generado por IA para organizar una sesion de estudio.',
    difficulty: ['basico', 'intermedio', 'avanzado', 'dificil'].includes(plan.difficulty)
      ? plan.difficulty
      : 'intermedio',
    total_minutes: totalMinutes || Math.max(25, Number(plan.total_minutes) || 25),
    blocks: safeBlocks.length
      ? safeBlocks
      : [
          {
            title: 'Bloque de estudio',
            description: 'Repasar conceptos principales y practicar con ejercicios.',
            block_type: 'practica',
            duration_minutes: 25,
            resources: ['Apuntes de clase'],
            steps: ['Leer el contenido clave', 'Resolver ejercicios', 'Anotar dudas'],
          },
        ],
  };
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Metodo no permitido.' }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey =
      Deno.env.get('SUPABASE_ANON_KEY') ?? getFirstSecretValue(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS'));
    const serviceRoleKey =
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? getFirstSecretValue(Deno.env.get('SUPABASE_SECRET_KEYS'));
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    const authHeader = req.headers.get('Authorization') ?? '';

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return jsonResponse({ error: 'Variables de Supabase no configuradas.' }, 500);
    }

    if (!geminiApiKey) {
      return jsonResponse({ error: 'Falta configurar el secreto GEMINI_API_KEY en Supabase.' }, 500);
    }

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await authClient.auth.getUser();

    if (userError || !userData.user) {
      return jsonResponse({ error: 'Sesion invalida. Inicia sesion nuevamente.' }, 401);
    }

    const { prompt } = (await req.json()) as { prompt?: string };

    if (!prompt?.trim()) {
      return jsonResponse({ error: 'Describe que necesitas estudiar.' }, 400);
    }

    const systemPrompt = `
Eres el motor de planificacion de FocusSync. Genera un plan de estudio Pomodoro en JSON estricto.
No uses Markdown. No agregues texto fuera del JSON.
El JSON debe tener esta forma:
{
  "title": "string",
  "description": "string",
  "difficulty": "basico|intermedio|avanzado|dificil",
  "total_minutes": number,
  "blocks": [
    {
      "title": "string",
      "description": "string",
      "block_type": "teoria|practica|descanso",
      "duration_minutes": number,
      "resources": ["string"],
      "steps": ["string"]
    }
  ]
}
Usa bloques entre 10 y 60 minutos. Incluye descansos cuando el plan supere 50 minutos.
`;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: `${systemPrompt}\nSolicitud del estudiante: ${prompt.trim()}` }],
            },
          ],
          generationConfig: {
            temperature: 0.4,
            responseMimeType: 'application/json',
          },
        }),
      },
    );

    if (!geminiResponse.ok) {
      const geminiError = await geminiResponse.text();

      return jsonResponse(
        {
          error: `Gemini no pudo generar el plan (${geminiResponse.status}). ${geminiError.slice(0, 300)}`,
        },
        502,
      );
    }

    const geminiPayload = await geminiResponse.json();
    const text = geminiPayload.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return jsonResponse({ error: 'Gemini no devolvio contenido util.' }, 502);
    }

    const generatedPlan = normalizePlan(parseGeminiJson(text));
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: planRow, error: planError } = await adminClient
      .from('study_plans')
      .insert({
        user_id: userData.user.id,
        title: generatedPlan.title,
        description: generatedPlan.description,
        difficulty: generatedPlan.difficulty,
        total_minutes: generatedPlan.total_minutes,
        source_prompt: prompt.trim(),
        ai_model: 'gemini-3.6-flash',
      })
      .select('id, title, description, difficulty, total_minutes, total_blocks')
      .single();

    if (planError || !planRow) {
      return jsonResponse({ error: planError?.message ?? 'No se pudo guardar el plan generado.' }, 500);
    }

    const blockRows = generatedPlan.blocks.map((block, index) => ({
      plan_id: planRow.id,
      title: block.title,
      description: block.description,
      block_type: block.block_type,
      duration_minutes: block.duration_minutes,
      block_order: index + 1,
      resources: block.resources,
      steps: block.steps,
    }));

    const { data: savedBlocks, error: blocksError } = await adminClient
      .from('study_blocks')
      .insert(blockRows)
      .select('id, title, description, block_type, duration_minutes, block_order, resources, steps')
      .order('block_order', { ascending: true });

    if (blocksError || !savedBlocks) {
      return jsonResponse({ error: blocksError?.message ?? 'No se pudieron guardar los bloques del plan.' }, 500);
    }

    await adminClient.from('ai_messages').insert([
      {
        user_id: userData.user.id,
        plan_id: planRow.id,
        sender: 'usuario',
        content: prompt.trim(),
      },
      {
        user_id: userData.user.id,
        plan_id: planRow.id,
        sender: 'ia',
        content: generatedPlan.description,
      },
    ]);

    const plan = {
      id: planRow.id,
      title: planRow.title,
      description: planRow.description,
      difficulty: planRow.difficulty,
      difficultyLabel: planRow.difficulty.charAt(0).toUpperCase() + planRow.difficulty.slice(1),
      totalMinutes: planRow.total_minutes,
      totalTime:
        planRow.total_minutes >= 60
          ? `${Math.floor(planRow.total_minutes / 60)}h ${planRow.total_minutes % 60}m`.trim()
          : `${planRow.total_minutes} min`,
      blocks: savedBlocks.map((block) => ({
        id: block.id,
        title: block.title,
        description: block.description,
        type: block.block_type,
        durationMinutes: block.duration_minutes,
        duration: `${block.duration_minutes} min`,
        resources: block.resources,
        steps: block.steps,
      })),
    };

    return jsonResponse({
      message: `Listo. Genere el plan "${plan.title}" con ${plan.blocks.length} bloques.`,
      plan,
    });
  } catch (error) {
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : 'No se pudo generar el plan.',
      },
      500,
    );
  }
});
