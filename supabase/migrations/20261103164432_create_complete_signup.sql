-- Conclui o cadastro de uma vez só: ou grava tudo, ou não grava nada.
-- "security invoker" faz a função rodar com as permissões de quem a chamou, então as
-- políticas de RLS continuam valendo. Ela não dá nenhum poder a mais.

create function public.complete_signup(
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

  insert into public.profiles_private (user_id, home_city_id, age_confirmed_at)
  values (v_user_id, p_home_city_id, now());

  insert into public.profiles (id, name, username)
  values (v_user_id, btrim(p_name), p_username);
end;
$$;

-- Por padrão, o Postgres deixa qualquer um executar uma função nova.
revoke execute on function public.complete_signup(text, text, uuid, boolean, boolean, text[])
  from public, anon;
grant execute on function public.complete_signup(text, text, uuid, boolean, boolean, text[])
  to authenticated;
