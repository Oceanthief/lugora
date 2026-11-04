-- Critério de aceite da Fatia 2: sem a confirmação de 18+, o cadastro não conclui.
begin;
select plan(16);

insert into auth.users (id, email) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'a@example.com'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'b@example.com');

insert into public.countries (id, name, iso_code, boundary) values
  ('99999999-0000-4000-8000-000000000000', 'Terra de Teste', 'ZZ', 'SRID=4326;MULTIPOLYGON(((0 0,0 1,1 1,1 0,0 0)))');

insert into public.cities (id, name, country_id, boundary, gers_id) values
  ('99999999-0000-4000-8000-000000000001', 'Cidade de Teste', '99999999-0000-4000-8000-000000000000', 'SRID=4326;MULTIPOLYGON(((0 0,0 1,1 1,1 0,0 0)))', 'test-city');

-- Pessoa A logada, ainda sem cadastro
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}';

select throws_ok(
  $$ select public.complete_signup('Pessoa A', 'pessoa_a', '99999999-0000-4000-8000-000000000001', false, true) $$,
  'P0001', 'age_confirmation_required', 'sem marcar 18+, o cadastro não conclui'
);
select throws_ok(
  $$ select public.complete_signup('Pessoa A', 'pessoa_a', '99999999-0000-4000-8000-000000000001', null, true) $$,
  'P0001', 'age_confirmation_required', 'com o 18+ em branco, o cadastro não conclui'
);
select throws_ok(
  $$ select public.complete_signup('Pessoa A', 'pessoa_a', '99999999-0000-4000-8000-000000000001', true, false) $$,
  'P0001', 'policy_acceptance_required', 'sem aceitar a política, o cadastro não conclui'
);
select is_empty(
  $$ select id from public.profiles where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' $$,
  'as tentativas recusadas não criam perfil'
);
select is_empty(
  $$ select id from public.consents where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' $$,
  'as tentativas recusadas não registram consentimento'
);
select lives_ok(
  $$ select public.complete_signup('  Pessoa A  ', 'pessoa_a', '99999999-0000-4000-8000-000000000001', true, true, array['analytics']) $$,
  'com 18+ e aceite, o cadastro conclui'
);
select results_eq(
  $$ select name, username from public.profiles where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' $$,
  $$ values ('Pessoa A', 'pessoa_a') $$,
  'o perfil fica com nome (sem espaços nas pontas) e @'
);
select results_eq(
  $$ select home_city_id from public.profiles_private where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' $$,
  $$ values ('99999999-0000-4000-8000-000000000001'::uuid) $$,
  'a cidade fica nos dados privados'
);
select is(
  (select age_confirmed_at from public.profiles_private where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  now(),
  'a data da confirmação de 18+ vem do banco, na hora do cadastro'
);
select results_eq(
  $$ select purpose, granted from public.consents where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' order by purpose $$,
  $$ values ('analytics', true), ('emails', false), ('essential', true), ('precise_location', false) $$,
  'cada finalidade fica com a sua resposta, inclusive os "não"'
);
select results_eq(
  $$ select distinct policy_version from public.consents where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' $$,
  $$ select value #>> '{}' from public.app_parameters where key = 'privacy_policy_version' $$,
  'os consentimentos guardam a versão atual da política'
);
select throws_ok(
  $$ select public.complete_signup('Pessoa A', 'outro_a', '99999999-0000-4000-8000-000000000001', true, true) $$,
  '23505', null, 'quem já tem cadastro não conclui de novo'
);

reset role;

-- Pessoa B logada, tentando um @ que já existe
set local role authenticated;
set local request.jwt.claims = '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}';

select throws_ok(
  $$ select public.complete_signup('Pessoa B', 'pessoa_a', '99999999-0000-4000-8000-000000000001', true, true) $$,
  '23505', null, 'um @ já usado impede o cadastro'
);
select is_empty(
  $$ select id from public.consents where user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' $$,
  'o cadastro que falha no fim não deixa nada pela metade'
);

reset role;

-- A função roda com as permissões do dono: sem usuário no token, ela não grava em nome de ninguém.
set local role authenticated;
set local request.jwt.claims = '{"role":"authenticated"}';

select throws_ok(
  $$ select public.complete_signup('Ninguém', 'ninguem', '99999999-0000-4000-8000-000000000001', true, true) $$,
  'P0001', 'not_authenticated', 'sem usuário no token, o cadastro não conclui'
);

reset role;

-- Sem login
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';

select throws_ok(
  $$ select public.complete_signup('Visitante', 'visitante', '99999999-0000-4000-8000-000000000001', true, true) $$,
  '42501', null, 'visitante não executa o cadastro'
);

reset role;

select * from finish();
rollback;
