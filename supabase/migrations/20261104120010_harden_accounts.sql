-- Correções da revisão de privacidade da Fatia 2.

-- 1. O Lugora não usa senha (ADR 0009), mas a API do Supabase Auth aceita criar conta com uma.
-- Sem esta regra, alguém cria a conta com o e-mail de outra pessoa e escolhe a senha; quando a
-- dona do e-mail confirma com o código dela, a senha continua valendo, e quem a escolheu entra.
-- O schema private não é exposto pela API.
create schema if not exists private;

create function private.discard_password()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.encrypted_password := null;
  return new;
end;
$$;

create trigger auth_users_discard_password
  before insert or update on auth.users
  for each row execute function private.discard_password();

-- 2. Quem chama a API direto não escolhe a data da confirmação de 18+, as datas de criação nem
-- uma versão inventada da política. Essas informações passam a vir do próprio banco.
alter table public.profiles_private alter column age_confirmed_at set default now();

revoke insert on table public.profiles_private from authenticated;
grant insert (user_id, home_city_id) on table public.profiles_private to authenticated;

revoke insert on table public.profiles from authenticated;
grant insert (id, name, username) on table public.profiles to authenticated;

revoke insert on table public.consents from authenticated;
grant insert (user_id, purpose, policy_version, granted) on table public.consents to authenticated;

drop policy consents_insert_own on public.consents;
create policy consents_insert_own on public.consents
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and policy_version = (
      select parameter.value #>> '{}'
      from public.app_parameters as parameter
      where parameter.key = 'privacy_policy_version'
    )
  );

-- A função continua igual, menos a data do 18+, que agora vem do valor padrão da coluna.
create or replace function public.complete_signup(
  p_name text,
  p_username text,
  p_home_city_id uuid,
  p_age_confirmed boolean,
  p_policy_accepted boolean,
  p_granted_purposes text[] default '{}'
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_policy_version text;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  if p_age_confirmed is not true then
    raise exception 'age_confirmation_required';
  end if;

  if p_policy_accepted is not true then
    raise exception 'policy_acceptance_required';
  end if;

  select value #>> '{}' into strict v_policy_version
  from public.app_parameters
  where key = 'privacy_policy_version';

  -- Guarda também os "não": cada finalidade fica com uma resposta registrada.
  insert into public.consents (user_id, purpose, policy_version, granted)
  select
    v_user_id,
    purpose,
    v_policy_version,
    purpose = 'essential' or purpose = any (coalesce(p_granted_purposes, '{}'))
  from unnest(array['essential', 'precise_location', 'emails', 'analytics']) as purpose;

  insert into public.profiles_private (user_id, home_city_id)
  values (v_user_id, p_home_city_id);

  insert into public.profiles (id, name, username)
  values (v_user_id, btrim(p_name), p_username);
end;
$$;

-- 3. Estar logado não prova ter 18 anos: basta um e-mail. Só quem concluiu o cadastro, com a
-- confirmação de 18+, vê os perfis das outras pessoas.
drop policy profiles_select_authenticated on public.profiles;
create policy profiles_select_signed_up on public.profiles
  for select to authenticated
  using (
    (select exists (
      select 1 from public.profiles_private as private
      where private.user_id = (select auth.uid())
    ))
  );
