-- ============================================================
-- REPARACION: esquema profiles mezclado
-- Ejecutar si Supabase Auth devuelve "Database error saving new user".
-- Cubre bases creadas primero con display_name y luego con full_name.
-- ============================================================

do $$
begin
  create type public.auth_provider as enum ('email', 'google');
exception
  when duplicate_object then null;
end $$;

alter table public.profiles
add column if not exists full_name varchar(120);

alter table public.profiles
add column if not exists display_name text;

alter table public.profiles
add column if not exists email varchar(180);

alter table public.profiles
add column if not exists avatar_url text;

alter table public.profiles
add column if not exists daily_goal_minutes integer not null default 120;

alter table public.profiles
add column if not exists current_streak integer not null default 0;

alter table public.profiles
alter column full_name set default 'Estudiante';

alter table public.profiles
alter column email drop not null;

alter table public.profiles
drop constraint if exists profiles_email_key;

update public.profiles
set
  full_name = coalesce(nullif(trim(full_name), ''), nullif(trim(display_name), ''), split_part(coalesce(email, ''), '@', 1), 'Estudiante'),
  display_name = coalesce(nullif(trim(display_name), ''), nullif(trim(full_name), ''), split_part(coalesce(email, ''), '@', 1), 'Estudiante')
where full_name is null
   or trim(full_name) = ''
   or display_name is null
   or trim(display_name) = '';

alter table public.profiles
alter column full_name set not null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_name text;
  provider_name text;
begin
  profile_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    nullif(trim(new.raw_user_meta_data->>'name'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'Estudiante'
  );

  provider_name := coalesce(new.raw_app_meta_data->>'provider', 'email');

  insert into public.profiles (
    id,
    full_name,
    display_name,
    email,
    auth_provider
  )
  values (
    new.id,
    left(profile_name, 120),
    profile_name,
    new.email,
    case
      when provider_name = 'google' then 'google'
      else 'email'
    end::public.auth_provider
  )
  on conflict (id) do update
  set
    full_name = excluded.full_name,
    display_name = excluded.display_name,
    email = excluded.email,
    auth_provider = excluded.auth_provider,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists trg_auth_user_created on auth.users;
drop trigger if exists on_auth_user_created on auth.users;

create trigger trg_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();
