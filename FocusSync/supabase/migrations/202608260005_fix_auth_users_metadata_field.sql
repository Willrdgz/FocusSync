-- ============================================================
-- REPARACION: campo correcto de metadata en auth.users
-- Corrige "record new has no field app_metadata".
-- En Supabase Auth el campo es raw_app_meta_data.
-- ============================================================

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
