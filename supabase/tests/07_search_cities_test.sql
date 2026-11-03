-- Os nomes com "Zzteste" não existem de verdade, então o teste não depende do seed nem do pipeline.
begin;
select plan(12);

insert into auth.users (id, email) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'a@example.com');

insert into public.countries (id, name, iso_code, boundary) values
  ('99999999-0000-4000-8000-000000000000', 'Terra de Teste', 'ZZ', 'SRID=4326;MULTIPOLYGON(((0 0,0 1,1 1,1 0,0 0)))');

insert into public.cities (name, state, country_id, boundary, gers_id)
select name, state, '99999999-0000-4000-8000-000000000000', 'SRID=4326;MULTIPOLYGON(((0 0,0 1,1 1,1 0,0 0)))', 'test-' || name || '-' || state
from (values
  ('São Zzteste', 'MG'),
  ('São Zzteste', 'BA'),
  ('Zzteste', 'RJ'),
  ('Zzteste-Mirim', 'SP'),
  ('Zzteste d''Água', 'CE'),
  ('Alto Zzteste', 'PR')
) as city (name, state);

insert into public.cities (name, state, country_id, boundary, gers_id)
select 'Limite Yyteste ' || n, 'TT', '99999999-0000-4000-8000-000000000000', 'SRID=4326;MULTIPOLYGON(((0 0,0 1,1 1,1 0,0 0)))', 'test-limite-' || n
from generate_series(1, 12) as n;

set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}';

select results_eq(
  $$ select name, state from public.search_cities('sao zzteste') $$,
  $$ values ('São Zzteste', 'BA'), ('São Zzteste', 'MG') $$,
  'acha com acento digitando sem acento, com as duas UFs'
);
select results_eq(
  $$ select name, state from public.search_cities('  SÃO ZZTESTE ') $$,
  $$ values ('São Zzteste', 'BA'), ('São Zzteste', 'MG') $$,
  'ignora maiúsculas e espaços nas pontas'
);
select results_eq(
  $$ select name, state from public.search_cities('zzteste') $$,
  $$ values ('Zzteste', 'RJ'), ('Zzteste d''Água', 'CE'), ('Zzteste-Mirim', 'SP'), ('Alto Zzteste', 'PR'), ('São Zzteste', 'BA'), ('São Zzteste', 'MG') $$,
  'mostra o nome exato, depois quem começa com o termo, depois o resto'
);
select results_eq(
  $$ select name from public.search_cities('zzteste mirim') $$,
  $$ values ('Zzteste-Mirim') $$,
  'acha nome com hífen digitando com espaço'
);
select results_eq(
  $$ select name from public.search_cities('zzteste d''agua') $$,
  $$ values ('Zzteste d''Água') $$,
  'acha nome com apóstrofo'
);
select is_empty($$ select id from public.search_cities('z') $$, 'uma letra só não busca');
select is_empty($$ select id from public.search_cities('   ') $$, 'só espaços não busca');
select is_empty($$ select id from public.search_cities(null) $$, 'busca vazia não devolve nada');
select is_empty($$ select id from public.search_cities('%%') $$, '% não funciona como curinga');
select is(
  (select count(*)::int from public.search_cities('limite yyteste')),
  10,
  'devolve no máximo 10 cidades'
);
select is(
  pg_catalog.pg_get_function_result('public.search_cities(text)'::regprocedure),
  'TABLE(id uuid, name text, state text)',
  'devolve só id, nome e UF, sem o polígono'
);

reset role;

set local role anon;
set local request.jwt.claims = '{"role":"anon"}';

select throws_ok(
  $$ select id from public.search_cities('zzteste') $$,
  '42501', null, 'visitante não usa a busca do cadastro'
);

reset role;

select * from finish();
rollback;
