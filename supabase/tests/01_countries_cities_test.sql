begin;
select plan(12);

insert into auth.users (id, email) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'a@example.com');

insert into public.countries (id, name, iso_code, boundary) values
  ('99999999-0000-4000-8000-000000000000', 'Terra de Teste', 'ZZ', 'SRID=4326;MULTIPOLYGON(((0 0,0 1,1 1,1 0,0 0)))');

insert into public.cities (name, state, country_id, boundary, gers_id) values
  ('Cidade de Teste', 'TT', '99999999-0000-4000-8000-000000000000', 'SRID=4326;MULTIPOLYGON(((0 0,0 1,1 1,1 0,0 0)))', 'test-city');

-- Sem login
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';

select isnt_empty($$ select id from public.countries where iso_code = 'ZZ' $$, 'visitante lê países');
select isnt_empty($$ select id from public.cities where gers_id = 'test-city' $$, 'visitante lê cidades');
select throws_ok(
  $$ insert into public.countries (name, iso_code, boundary) values ('X', 'XX', 'SRID=4326;MULTIPOLYGON(((0 0,0 1,1 1,1 0,0 0)))') $$,
  '42501', null, 'visitante não cria país'
);

reset role;

-- Logado
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}';

select isnt_empty($$ select id from public.countries where iso_code = 'ZZ' $$, 'usuário lê países');
select isnt_empty($$ select id from public.cities where gers_id = 'test-city' $$, 'usuário lê cidades');
select throws_ok(
  $$ insert into public.countries (name, iso_code, boundary) values ('X', 'XX', 'SRID=4326;MULTIPOLYGON(((0 0,0 1,1 1,1 0,0 0)))') $$,
  '42501', null, 'usuário não cria país'
);
select throws_ok(
  $$ insert into public.cities (name, country_id, boundary, gers_id) values ('X', '99999999-0000-4000-8000-000000000000', 'SRID=4326;MULTIPOLYGON(((0 0,0 1,1 1,1 0,0 0)))', 'x') $$,
  '42501', null, 'usuário não cria cidade'
);
-- Desde a Fatia 4, a API nem tem a permissão de alterar ou apagar: a tentativa dá erro.
select throws_ok($$ update public.countries set name = 'Hackeado' where iso_code = 'ZZ' $$, '42501', null, 'usuário não altera país');
select throws_ok($$ update public.cities set name = 'Hackeada' where gers_id = 'test-city' $$, '42501', null, 'usuário não altera cidade');
select throws_ok($$ delete from public.countries where iso_code = 'ZZ' $$, '42501', null, 'usuário não apaga país');
select throws_ok($$ delete from public.cities where gers_id = 'test-city' $$, '42501', null, 'usuário não apaga cidade');

reset role;

select results_eq(
  $$ select name from public.cities where gers_id = 'test-city' $$,
  $$ values ('Cidade de Teste') $$,
  'a cidade continua igual depois das tentativas'
);

select * from finish();
rollback;
