begin;
select plan(16);

insert into auth.users (id, email) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'a@example.com'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'b@example.com'),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'c@example.com');

insert into public.countries (id, name, iso_code, boundary) values
  ('99999999-0000-4000-8000-000000000000', 'Terra de Teste', 'ZZ', 'SRID=4326;MULTIPOLYGON(((0 0,0 1,1 1,1 0,0 0)))');

insert into public.cities (id, name, country_id, boundary, gers_id) values
  ('99999999-0000-4000-8000-000000000001', 'Cidade de Teste', '99999999-0000-4000-8000-000000000000', 'SRID=4326;MULTIPOLYGON(((0 0,0 1,1 1,1 0,0 0)))', 'test-city');

-- A e B concluíram o cadastro. C só fez o login.
insert into public.profiles_private (user_id, home_city_id) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '99999999-0000-4000-8000-000000000001'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '99999999-0000-4000-8000-000000000001');

insert into public.profiles (id, name, username) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Pessoa A', 'pessoa_a'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Pessoa B', 'pessoa_b');

-- Pessoa A logada
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}';

select results_eq(
  $$ select name from public.profiles where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' $$,
  $$ values ('Pessoa A') $$,
  'A lê o próprio perfil'
);
select results_eq(
  $$ select username from public.profiles where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' $$,
  $$ values ('pessoa_b') $$,
  'A lê o @ de B'
);
select results_eq(
  $$ update public.profiles set name = 'Novo nome de A' where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' returning name $$,
  $$ values ('Novo nome de A') $$,
  'A edita o próprio perfil'
);
select is_empty(
  $$ update public.profiles set name = 'Hackeado' where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' returning id $$,
  'A não edita o perfil de B'
);
select throws_ok(
  $$ update public.profiles set id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc' where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' $$,
  '42501', null, 'A não troca o id do próprio perfil'
);
select throws_ok(
  $$ update public.profiles set username = 'Com Espaco' where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' $$,
  '23514', null, 'o @ só aceita minúsculas, números e sublinhado'
);
select throws_ok(
  $$ update public.profiles set username = 'pessoa_b' where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' $$,
  '23505', null, 'duas pessoas não têm o mesmo @'
);
select throws_ok(
  $$ insert into public.profiles (id, name, username) values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'Falsa', 'falsa') $$,
  '42501', null, 'A não cria perfil em nome de outra pessoa'
);
select is_empty(
  $$ delete from public.profiles where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' returning id $$,
  'A não apaga o próprio perfil por esta tabela'
);
select is_empty(
  $$ delete from public.profiles where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' returning id $$,
  'A não apaga o perfil de B'
);

reset role;

-- Pessoa C, sem confirmação de 18+ nem aceite da política
set local role authenticated;
set local request.jwt.claims = '{"sub":"cccccccc-cccc-4ccc-8ccc-cccccccccccc","role":"authenticated"}';

select throws_ok(
  $$ insert into public.profiles (id, name, username) values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'Pessoa C', 'pessoa_c') $$,
  '42501', null, 'C não cria o perfil pela API sem passar pelo 18+ e pelo aceite'
);
select is_empty(
  $$ select id from public.profiles $$,
  'quem só fez o login não lê o perfil de ninguém'
);
select throws_ok(
  $$ insert into public.profiles (id, name, username, created_at) values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'Pessoa C', 'pessoa_c', '2000-01-01') $$,
  '42501', 'permission denied for table profiles', 'C não escolhe a data de criação do perfil'
);

reset role;

select results_eq(
  $$ select name from public.profiles where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' $$,
  $$ values ('Pessoa B') $$,
  'o perfil de B continua igual depois das tentativas'
);
select isnt_empty(
  $$ select id from public.profiles where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' $$,
  'o perfil de A continua existindo'
);

-- Sem login
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';

select throws_ok(
  $$ select id from public.profiles $$,
  '42501', null, 'visitante não lê perfis'
);

reset role;

select * from finish();
rollback;
