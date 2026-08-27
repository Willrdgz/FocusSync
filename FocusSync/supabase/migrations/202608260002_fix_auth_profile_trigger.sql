-- ============================================================
-- REPARACION: trigger de creacion de perfiles
-- Objetivo: resolver "Database error saving new user" al registrar
-- usuarios desde Supabase Auth.
-- ============================================================

alter table public.profiles
alter column full_name set default 'Estudiante';

alter table public.profiles
alter column email drop not null;

alter table public.profiles
drop constraint if exists profiles_email_key;

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
    nullif(coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Estudiante'), ''),
    new.email,
    case
      when new.raw_app_meta_data->>'provider' = 'google' then 'google'::public.auth_provider
      else 'email'::public.auth_provider
    end
  )
  on conflict (id) do update
  set
    full_name = coalesce(excluded.full_name, public.profiles.full_name, 'Estudiante'),
    email = coalesce(excluded.email, public.profiles.email),
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
