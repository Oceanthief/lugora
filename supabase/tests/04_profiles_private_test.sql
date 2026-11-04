-- Critério de aceite da Fatia 2: A pede o perfil de B e home_city_id não vem.
begin;
select plan(15);

insert into auth.users (id, email) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'a@example.com'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'b@example.com'),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'c@example.com');

insert into public.countries (id, name, iso_code, boundary) values
  ('99999999-0000-4000-8000-000000000000', 'Terra de Teste', 'ZZ', 'SRID=4326;MULTIPOLYGON(((0 0,0 1,1 1,1 0,0 0)))');

insert into public.cities (id, name, country_id, boundary, gers_id) values
  ('99999999-0000-4000-8000-00000000000a', 'Cidade de A', '99999999-0000-4000-8000-000000000000', 'SRID=4326;MULTIPOLYGON(((0 0,0 1,1 1,1 0,0 0)))', 'test-city-a'),
  ('99999999-0000-4000-8000-00000000000b', 'Cidade de B', '99999999-0000-4000-8000-000000000000', 'SRID=4326;MULTIPOLYGON(((0 0,0 1,1 1,1 0,0 0)))', 'test-city-b');

insert into public.profiles_private (user_id, home_city_id, age_confirmed_at) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '99999999-0000-4000-8000-00000000000a', now()),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '99999999-0000-4000-8000-00000000000b', now());

select hasnt_column('public', 'profiles', 'home_city_id', 'a cidade de residência não existe na tabela de perfis');

-- Pessoa A logada
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}';

select results_eq(
  $$ select home_city_id from public.profiles_private where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' $$,
  $$ values ('99999999-0000-4000-8000-00000000000a'::uuid) $$,
  'A lê a própria cidade de residência'
);
select is_empty(
  $$ select home_city_id from public.profiles_private where user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' $$,
  'A pede a cidade de residência de B e nada vem'
);
select results_eq(
  $$ select user_id from public.profiles_private $$,
  $$ values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid) $$,
  'A lista a tabela inteira e só enxerga a própria linha'
);
select results_eq(
  $$ update public.profiles_private set home_city_id = '99999999-0000-4000-8000-00000000000b' where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' returning home_city_id $$,
  $$ values ('99999999-0000-4000-8000-00000000000b'::uuid) $$,
  'A muda a própria cidade'
);
select is_empty(
  $$ update public.profiles_private set home_city_id = '99999999-0000-4000-8000-00000000000a' where user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' returning user_id $$,
  'A não muda a cidade de B'
);
select throws_ok(
  $$ update public.profiles_private set age_confirmed_at = now() where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' $$,
  '42501', null, 'A não altera a data da confirmação de 18+'
);
select throws_ok(
  $$ insert into public.profiles_private (user_id, home_city_id) values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', '99999999-0000-4000-8000-00000000000a') $$,
  '42501', 'new row violates row-level security policy for table "profiles_private"', 'A não cria dados privados em nome de outra pessoa'
);
select is_empty(
  $$ delete from public.profiles_private where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' returning user_id $$,
  'A não apaga a própria linha por esta tabela'
);
select is_empty(
  $$ delete from public.profiles_private where user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' returning user_id $$,
  'A não apaga a linha de B'
);

reset role;

-- Pessoa C logada
set local role authenticated;
set local request.jwt.claims = '{"sub":"cccccccc-cccc-4ccc-8ccc-cccccccccccc","role":"authenticated"}';

select throws_ok(
  $$ insert into public.profiles_private (user_id, home_city_id, age_confirmed_at) values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', '99999999-0000-4000-8000-00000000000a', '2099-01-01') $$,
  '42501', 'permission denied for table profiles_private', 'C não escolhe a própria data de 18+'
);
select lives_ok(
  $$ insert into public.profiles_private (user_id, home_city_id) values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', '99999999-0000-4000-8000-00000000000a') $$,
  'C cria os próprios dados privados'
);
select ok(
  (select age_confirmed_at <= now() from public.profiles_private where user_id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'),
  'a data do 18+ vem do banco'
);

reset role;

select results_eq(
  $$ select home_city_id from public.profiles_private where user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' $$,
  $$ values ('99999999-0000-4000-8000-00000000000b'::uuid) $$,
  'a cidade de B continua igual depois das tentativas'
);

-- Sem login
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';

select throws_ok(
  $$ select user_id from public.profiles_private $$,
  '42501', null, 'visitante não lê dados privados'
);

reset role;

select * from finish();
rollback;
