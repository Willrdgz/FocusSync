-- ============================================================
-- BASE DE DATOS: FocusSync
-- DBMS: PostgreSQL administrado por Supabase
-- Objetivo: Persistir usuarios, planes de estudio, bloques,
-- sesiones de enfoque, distracciones, mensajes IA y feedback.
-- ============================================================

create extension if not exists "pgcrypto";

-- ============================================================
-- TIPOS ENUMERADOS
-- ============================================================

do $$
begin
  create type public.auth_provider as enum ('email', 'google');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.plan_difficulty as enum ('basico', 'intermedio', 'avanzado', 'dificil');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.block_type as enum ('teoria', 'practica', 'descanso');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.session_status as enum ('en_ejecucion', 'pausada', 'completada', 'terminada', 'cancelada');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.distraction_type as enum ('dispositivo_levantado', 'movimiento_detectado', 'orientacion_incorrecta');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.message_sender as enum ('usuario', 'ia');
exception
  when duplicate_object then null;
end $$;

-- ============================================================
-- TABLAS
-- ============================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name varchar(120) not null default 'Estudiante',
  email varchar(180),
  auth_provider public.auth_provider not null default 'email',
  avatar_url text,
  daily_goal_minutes integer not null default 120 check (daily_goal_minutes > 0),
  current_streak integer not null default 0 check (current_streak >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.study_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title varchar(160) not null,
  description text,
  difficulty public.plan_difficulty not null default 'intermedio',
  total_minutes integer not null check (total_minutes > 0),
  total_blocks integer not null default 0 check (total_blocks >= 0),
  source_prompt text,
  ai_model varchar(80) default 'gemini',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.study_blocks (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.study_plans(id) on delete cascade,
  title varchar(160) not null,
  description text,
  block_type public.block_type not null,
  duration_minutes integer not null check (duration_minutes > 0),
  block_order integer not null check (block_order > 0),
  resources jsonb not null default '[]'::jsonb,
  steps jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_study_blocks_plan_order unique (plan_id, block_order)
);

create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan_id uuid references public.study_plans(id) on delete set null,
  sender public.message_sender not null,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.focus_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan_id uuid references public.study_plans(id) on delete set null,
  block_id uuid references public.study_blocks(id) on delete set null,
  planned_minutes integer not null check (planned_minutes > 0),
  real_minutes integer not null default 0 check (real_minutes >= 0),
  status public.session_status not null default 'en_ejecucion',
  started_at timestamptz not null default now(),
  paused_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_focus_session_finished check (
    finished_at is null
    or finished_at >= started_at
  )
);

create table if not exists public.distractions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.focus_sessions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  distraction_type public.distraction_type not null,
  description text,
  detected_at timestamptz not null default now(),
  sensor_payload jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  summary text not null,
  recommendation text not null,
  total_sessions_analyzed integer not null default 0 check (total_sessions_analyzed >= 0),
  total_distractions_analyzed integer not null default 0 check (total_distractions_analyzed >= 0),
  ai_model varchar(80) default 'gemini',
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- ============================================================
-- INDICES
-- ============================================================

create index if not exists idx_study_plans_user_id
on public.study_plans(user_id);

create index if not exists idx_study_plans_created_at
on public.study_plans(created_at desc);

create index if not exists idx_study_blocks_plan_id
on public.study_blocks(plan_id);

create index if not exists idx_ai_messages_user_id
on public.ai_messages(user_id);

create index if not exists idx_ai_messages_plan_id
on public.ai_messages(plan_id);

create index if not exists idx_focus_sessions_user_id
on public.focus_sessions(user_id);

create index if not exists idx_focus_sessions_plan_id
on public.focus_sessions(plan_id);

create index if not exists idx_focus_sessions_block_id
on public.focus_sessions(block_id);

create index if not exists idx_focus_sessions_started_at
on public.focus_sessions(started_at desc);

create index if not exists idx_distractions_session_id
on public.distractions(session_id);

create index if not exists idx_distractions_user_id
on public.distractions(user_id);

create index if not exists idx_ai_feedback_user_id
on public.ai_feedback(user_id);

create index if not exists idx_ai_feedback_generated_at
on public.ai_feedback(generated_at desc);

-- ============================================================
-- FUNCIONES Y TRIGGERS
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    email,
    auth_provider
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Estudiante'),
    new.email,
    case
      when new.raw_app_meta_data->>'provider' = 'google' then 'google'::public.auth_provider
      else 'email'::public.auth_provider
    end
  )
  on conflict (id) do update
  set
    full_name = excluded.full_name,
    email = excluded.email,
    auth_provider = excluded.auth_provider,
    updated_at = now();

  return new;
end;
$$;

create or replace function public.update_plan_total_blocks()
returns trigger
language plpgsql
as $$
declare
  affected_plan_id uuid;
begin
  affected_plan_id := coalesce(new.plan_id, old.plan_id);

  update public.study_plans
  set total_blocks = (
    select count(*)
    from public.study_blocks
    where plan_id = affected_plan_id
  )
  where id = affected_plan_id;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists trg_study_plans_updated_at on public.study_plans;
create trigger trg_study_plans_updated_at
before update on public.study_plans
for each row
execute function public.set_updated_at();

drop trigger if exists trg_study_blocks_updated_at on public.study_blocks;
create trigger trg_study_blocks_updated_at
before update on public.study_blocks
for each row
execute function public.set_updated_at();

drop trigger if exists trg_focus_sessions_updated_at on public.focus_sessions;
create trigger trg_focus_sessions_updated_at
before update on public.focus_sessions
for each row
execute function public.set_updated_at();

drop trigger if exists trg_auth_user_created on auth.users;
drop trigger if exists on_auth_user_created on auth.users;
create trigger trg_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

drop trigger if exists trg_update_plan_total_blocks_insert on public.study_blocks;
create trigger trg_update_plan_total_blocks_insert
after insert on public.study_blocks
for each row
execute function public.update_plan_total_blocks();

drop trigger if exists trg_update_plan_total_blocks_delete on public.study_blocks;
create trigger trg_update_plan_total_blocks_delete
after delete on public.study_blocks
for each row
execute function public.update_plan_total_blocks();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;
alter table public.study_plans enable row level security;
alter table public.study_blocks enable row level security;
alter table public.ai_messages enable row level security;
alter table public.focus_sessions enable row level security;
alter table public.distractions enable row level security;
alter table public.ai_feedback enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Users can view own study plans" on public.study_plans;
create policy "Users can view own study plans"
on public.study_plans
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create own study plans" on public.study_plans;
create policy "Users can create own study plans"
on public.study_plans
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own study plans" on public.study_plans;
create policy "Users can update own study plans"
on public.study_plans
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own study plans" on public.study_plans;
create policy "Users can delete own study plans"
on public.study_plans
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can view own study blocks" on public.study_blocks;
create policy "Users can view own study blocks"
on public.study_blocks
for select
to authenticated
using (
  exists (
    select 1
    from public.study_plans sp
    where sp.id = study_blocks.plan_id
      and sp.user_id = auth.uid()
  )
);

drop policy if exists "Users can create blocks in own plans" on public.study_blocks;
create policy "Users can create blocks in own plans"
on public.study_blocks
for insert
to authenticated
with check (
  exists (
    select 1
    from public.study_plans sp
    where sp.id = study_blocks.plan_id
      and sp.user_id = auth.uid()
  )
);

drop policy if exists "Users can update blocks in own plans" on public.study_blocks;
create policy "Users can update blocks in own plans"
on public.study_blocks
for update
to authenticated
using (
  exists (
    select 1
    from public.study_plans sp
    where sp.id = study_blocks.plan_id
      and sp.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.study_plans sp
    where sp.id = study_blocks.plan_id
      and sp.user_id = auth.uid()
  )
);

drop policy if exists "Users can delete blocks in own plans" on public.study_blocks;
create policy "Users can delete blocks in own plans"
on public.study_blocks
for delete
to authenticated
using (
  exists (
    select 1
    from public.study_plans sp
    where sp.id = study_blocks.plan_id
      and sp.user_id = auth.uid()
  )
);

drop policy if exists "Users can view own AI messages" on public.ai_messages;
create policy "Users can view own AI messages"
on public.ai_messages
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create own AI messages" on public.ai_messages;
create policy "Users can create own AI messages"
on public.ai_messages
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own AI messages" on public.ai_messages;
create policy "Users can delete own AI messages"
on public.ai_messages
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can view own focus sessions" on public.focus_sessions;
create policy "Users can view own focus sessions"
on public.focus_sessions
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create own focus sessions" on public.focus_sessions;
create policy "Users can create own focus sessions"
on public.focus_sessions
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own focus sessions" on public.focus_sessions;
create policy "Users can update own focus sessions"
on public.focus_sessions
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own focus sessions" on public.focus_sessions;
create policy "Users can delete own focus sessions"
on public.focus_sessions
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can view own distractions" on public.distractions;
create policy "Users can view own distractions"
on public.distractions
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create own distractions" on public.distractions;
create policy "Users can create own distractions"
on public.distractions
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own distractions" on public.distractions;
create policy "Users can delete own distractions"
on public.distractions
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can view own AI feedback" on public.ai_feedback;
create policy "Users can view own AI feedback"
on public.ai_feedback
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create own AI feedback" on public.ai_feedback;
create policy "Users can create own AI feedback"
on public.ai_feedback
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own AI feedback" on public.ai_feedback;
create policy "Users can delete own AI feedback"
on public.ai_feedback
for delete
to authenticated
using (auth.uid() = user_id);

-- ============================================================
-- VISTA PARA DASHBOARD
-- ============================================================

create or replace view public.dashboard_summary
with (security_invoker = true)
as
select
  p.id as user_id,
  p.full_name,
  p.daily_goal_minutes,
  coalesce(sum(fs.real_minutes), 0) as focused_minutes_today,
  count(distinct fs.id) as sessions_today,
  count(d.id) as distractions_today,
  p.current_streak
from public.profiles p
left join public.focus_sessions fs
  on fs.user_id = p.id
  and fs.started_at::date = current_date
left join public.distractions d
  on d.user_id = p.id
  and d.detected_at::date = current_date
group by
  p.id,
  p.full_name,
  p.daily_goal_minutes,
  p.current_streak;

-- ============================================================
-- COMENTARIOS
-- ============================================================

comment on table public.profiles is
'Perfil del estudiante asociado a Supabase Auth.';

comment on table public.study_plans is
'Planes de estudio generados por IA o gestionados por el estudiante.';

comment on table public.study_blocks is
'Bloques de teoria, practica o descanso pertenecientes a un plan de estudio.';

comment on table public.ai_messages is
'Mensajes intercambiados entre el estudiante y el modulo IA Coach.';

comment on table public.focus_sessions is
'Sesiones reales de enfoque asociadas a bloques de estudio.';

comment on table public.distractions is
'Eventos de distraccion detectados mediante sensores del dispositivo.';

comment on table public.ai_feedback is
'Retroalimentacion analitica generada por IA a partir del historial del estudiante.';
