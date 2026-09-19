# Supabase Backend

Esta carpeta contiene la base del backend de FocusSync para la primera entrega.

## Dia 1

- Modelo inicial de base de datos en `migrations/202608260001_initial_schema.sql`.
- Politicas RLS para aislar datos por usuario autenticado.
- Cliente Supabase configurado en `lib/supabase.ts`.
- Variables de entorno documentadas en `.env.example`.

## Pasos locales recomendados

```bash
supabase init
supabase start
supabase db reset
```

Para el proyecto remoto:

```bash
supabase link --project-ref <project-ref>
supabase db push
```

La API key de Gemini debe guardarse como secreto de Supabase:

```bash
supabase secrets set GEMINI_API_KEY=<api-key>
```

## Edge Function IA

La funcion `functions/generate-study-plan/index.ts` recibe una solicitud del estudiante, valida su sesion de Supabase, llama a Gemini y guarda el resultado en:

- `study_plans`
- `study_blocks`
- `ai_messages`

Deploy recomendado:

```bash
supabase functions deploy generate-study-plan
```
