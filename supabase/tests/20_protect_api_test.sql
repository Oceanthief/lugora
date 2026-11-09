-- Proteção da API (seção 9.4): polígonos fora da API e limite de escritas por pessoa.
begin;
select plan(15);

insert into auth.users (id, email) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'a@example.com'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'b@example.com');

insert into public.countries (id, name, iso_code, boundary) values
  ('99999999-0000-4000-8000-000000000000', 'Terra de Teste', 'ZZ', 'SRID=4326;MULTIPOLYGON(((0 0,0 1,1 1,1 0,0 0)))');

insert into public.cities (name, state, country_id, boundary, gers_id) values
  ('Cidade de Teste', 'TT', '99999999-0000-4000-8000-000000000000', 'SRID=4326;MULTIPOLYGON(((0 0,0 1,1 1,1 0,0 0)))', 'test-city');

-- 1. Polígonos
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';

select throws_ok($$ select boundary from public.cities $$, '42501', null, 'visitante não baixa o polígono das cidades');
select throws_ok($$ select boundary from public.countries $$, '42501', null, 'visitante não baixa o polígono dos países');
select results_eq(
  $$ select name, state from public.cities where gers_id = 'test-city' $$,
  $$ values ('Cidade de Teste', 'TT') $$,
  'o nome e a UF continuam públicos'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}';

select throws_ok($$ select boundary from public.cities $$, '42501', null, 'quem está logado também não baixa o polígono');
select throws_ok($$ select * from public.countries $$, '42501', null, 'nem com select *');
select is((select name from public.countries where iso_code = 'ZZ'), 'Terra de Teste', 'o nome do país continua saindo');
-- Alterar e apagar países e cidades: o teste 01 confere que a permissão saiu.

-- 2. Limite de escritas
reset role;
update public.app_parameters set value = '2' where key = 'api_write_limit';
-- Uma escrita antiga de A, fora da janela: não conta, e some.
insert into private.api_writes (user_id, requested_at) values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', now() - interval '1 hour');

set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}';

select lives_ok($$ select public.limit_api_writes() $$, 'primeira escrita de A passa');
select lives_ok($$ select public.limit_api_writes() $$, 'segunda também');
select throws_ok($$ select public.limit_api_writes() $$, 'PGRST', null, 'a terceira na mesma janela é recusada (429)');

set local request.jwt.claims = '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}';
select lives_ok($$ select public.limit_api_writes() $$, 'o limite é por pessoa: B continua escrevendo');
select throws_ok($$ select user_id from private.api_writes $$, '42501', null, 'a contagem não sai pela API');

reset role;

select is(
  (select count(*)::int from private.api_writes where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' and requested_at < now() - interval '5 minutes'),
  0,
  'o que passou da janela é apagado'
);

set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
select lives_ok($$ select public.limit_api_writes() $$, 'visitante passa pela função sem erro (e não escreve nada)');

reset role;

select is(
  (select count(*)::int from private.api_writes where user_id is null),
  0,
  'visitante não deixa contagem'
);
select ok(
  (select array_to_string(rolconfig, ',') like '%pgrst.db_pre_request=public.limit_api_writes%' from pg_roles where rolname = 'authenticator'),
  'a API chama o limite antes de cada pedido'
);

select * from finish();
rollback;
