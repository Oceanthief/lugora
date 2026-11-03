-- Dados de desenvolvimento, aplicados pelo `npx supabase db reset`. Só para bancos descartáveis.
--
-- Usuários: Victor Ramos (nome do autor, autorizado por ele) e dois nomes fictícios da
-- demonstração. Os e-mails usam example.com, domínio reservado que não entrega para ninguém.
--
-- Geografia: o Brasil e Juiz de Fora, com retângulos aproximados, para que o reset e a CI
-- funcionem sem o pipeline. O pipeline troca esses limites pelos reais e carrega o resto;
-- ele encontra estas linhas pelo iso_code e pelo gers_id, então nada duplica.

insert into public.countries (id, name, iso_code, boundary) values (
  '10000000-0000-4000-8000-000000000001',
  'Brasil',
  'BR',
  'SRID=4326;MULTIPOLYGON(((-74 -34,-34 -34,-34 6,-74 6,-74 -34)))'
);

insert into public.cities (id, name, state, country_id, boundary, gers_id) values (
  '20000000-0000-4000-8000-000000000001',
  'Juiz de Fora',
  'MG',
  '10000000-0000-4000-8000-000000000001',
  'SRID=4326;MULTIPOLYGON(((-43.7 -21.93,-43.15 -21.93,-43.15 -21.55,-43.7 -21.55,-43.7 -21.93)))',
  '8b275bf4-2525-4616-b815-f6c777ab419a'
);

create temporary table seed_users (id uuid, email text, name text, username text) on commit drop;

insert into seed_users (id, email, name, username) values
  ('a0000000-0000-4000-8000-000000000001', 'victor@example.com', 'Victor Ramos', 'victorramos'),
  ('a0000000-0000-4000-8000-000000000002', 'duda@example.com', 'Duda Freitas', 'dudafreitas'),
  ('a0000000-0000-4000-8000-000000000003', 'gabriel@example.com', 'Gabriel Santos', 'gabrielsantos');

-- O serviço de login não aceita nulo nas colunas de token, por isso as strings vazias.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new
)
select
  '00000000-0000-0000-0000-000000000000', id, 'authenticated', 'authenticated', email, '', now(),
  '{"provider":"email","providers":["email"]}', '{}', now(), now(),
  '', '', '', ''
from seed_users;

insert into auth.identities (user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
select
  id, id::text, 'email',
  jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true),
  now(), now(), now()
from seed_users;

insert into public.consents (user_id, purpose, policy_version, granted)
select
  seed_users.id,
  purpose,
  (select value #>> '{}' from public.app_parameters where key = 'privacy_policy_version'),
  purpose = 'essential'
from seed_users
cross join unnest(array['essential', 'precise_location', 'emails', 'analytics']) as purpose;

insert into public.profiles_private (user_id, home_city_id, age_confirmed_at)
select id, '20000000-0000-4000-8000-000000000001', now()
from seed_users;

insert into public.profiles (id, name, username)
select id, name, username
from seed_users;
