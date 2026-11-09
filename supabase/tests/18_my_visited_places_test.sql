-- O mapa e os números do próprio perfil: lugares distintos, a visita mais recente e só as próprias.
begin;
select plan(13);

insert into auth.users (id, email) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'a@example.com'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'b@example.com');

insert into public.countries (id, name, iso_code, boundary) values
  ('99999999-0000-4000-8000-000000000000', 'Terra de Teste', 'ZZ', 'SRID=4326;MULTIPOLYGON(((0 0,0 4,4 4,4 0,0 0)))');

insert into public.cities (id, name, state, country_id, boundary, gers_id) values
  ('99999999-0000-4000-8000-000000000001', 'Cidade de Casa', 'TT', '99999999-0000-4000-8000-000000000000', 'SRID=4326;MULTIPOLYGON(((0 0,0 1,1 1,1 0,0 0)))', 'test-home-city'),
  ('99999999-0000-4000-8000-000000000002', 'Cidade Distante', 'TT', '99999999-0000-4000-8000-000000000000', 'SRID=4326;MULTIPOLYGON(((2 2,2 3,3 3,3 2,2 2)))', 'test-far-city');

insert into public.profiles_private (user_id, home_city_id, age_confirmed_at) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '99999999-0000-4000-8000-000000000001', now()),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '99999999-0000-4000-8000-000000000001', now());

insert into public.profiles (id, name, username) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Pessoa A', 'teste_a'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Pessoa B', 'teste_b');

insert into public.places (id, name, location, city_id, category, is_visitable, is_sensitive, gers_id) values
  ('88888888-0000-4000-8000-000000000001', 'Lanchonete de Teste', 'SRID=4326;POINT(0.25 0.75)', '99999999-0000-4000-8000-000000000001', null, true, false, 'test-snack'),
  ('88888888-0000-4000-8000-000000000002', 'Hospital de Teste', 'SRID=4326;POINT(0.5 0.5)', '99999999-0000-4000-8000-000000000001', 'hospital', false, true, 'test-hospital'),
  ('88888888-0000-4000-8000-000000000003', 'Café Distante', 'SRID=4326;POINT(2.5 2.5)', '99999999-0000-4000-8000-000000000002', 'cafe', true, false, 'test-far-cafe');

-- A registra
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}';

select public.create_visit('88888888-0000-4000-8000-000000000001', current_date - 10, 3, '{}');
select public.create_visit('88888888-0000-4000-8000-000000000001', current_date, 4.5, '{}');
select public.create_visit('88888888-0000-4000-8000-000000000002', current_date, 4, '{}');
select public.create_visit('88888888-0000-4000-8000-000000000003', current_date - 1, 5, '{}');
select public.create_visit('88888888-0000-4000-8000-000000000003', current_date - 1, 2, '{}');

reset role;
set local request.jwt.claims = '';

-- Duas visitas no mesmo dia: a registrada por último é a que vale.
update public.visits set created_at = now() - interval '1 hour'
where place_id = '88888888-0000-4000-8000-000000000003' and rating = 5;

set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}';

select is((select count(*)::int from public.my_visited_places()), 3, 'cinco visitas a três lugares contam três lugares distintos');
select results_eq(
  $$ select visit_count, rating, last_visited_on from public.my_visited_places() where name = 'Lanchonete de Teste' $$,
  $$ values (2, 4.5, current_date) $$,
  'aceite: duas visitas ao mesmo lugar contam 1 lugar, com a nota da visita mais recente'
);
select is(
  (select rating from public.my_visited_places() where name = 'Café Distante'),
  2.0,
  'no mesmo dia, vale a visita registrada por último'
);
select results_eq(
  $$ select name, is_resident, away_visit_count from public.my_visited_places() order by name $$,
  $$ values ('Café Distante', false, 2), ('Hospital de Teste', true, 0), ('Lanchonete de Teste', true, 0) $$,
  'cada lugar diz se é da cidade de residência, e as visitas em viagem são contadas'
);
select isnt_empty(
  $$ select 1 from public.my_visited_places() where name = 'Hospital de Teste' $$,
  'a visita "só eu" aparece no mapa da própria dona'
);
select results_eq(
  $$ select round(latitude::numeric, 2), round(longitude::numeric, 2) from public.my_visited_places() where name = 'Lanchonete de Teste' $$,
  $$ values (0.75, 0.25) $$,
  'a posição do lugar vem em latitude e longitude'
);
select results_eq(
  $$ select city_name, city_state, country_code from public.my_visited_places() where name = 'Café Distante' $$,
  $$ values ('Cidade Distante', 'TT', 'ZZ') $$,
  'cada lugar traz a cidade e o país'
);
select ok(
  (select city_latitude between 2 and 3 and city_longitude between 2 and 3 from public.my_visited_places() where name = 'Café Distante'),
  'o ponto da cidade fica dentro do limite dela'
);
select is_empty(
  $$ select 1 from information_schema.routines where routine_name = 'my_visited_places' and data_type <> 'record' $$,
  'a função devolve uma tabela'
);
select is_empty(
  $$ select 1 from information_schema.parameters
     where specific_name like 'my_visited_places%' and parameter_mode = 'IN' $$,
  'a função não recebe parâmetro: não dá para pedir o mapa de outra pessoa'
);

-- B
set local request.jwt.claims = '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}';

select is_empty($$ select place_id from public.my_visited_places() $$, 'B não recebe nenhum lugar de A');

-- Sem sessão válida
set local request.jwt.claims = '{"role":"authenticated"}';

select is_empty($$ select place_id from public.my_visited_places() $$, 'sem pessoa na sessão, a função não devolve nada');

reset role;

-- Sem login
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';

select throws_ok($$ select place_id from public.my_visited_places() $$, '42501', null, 'visitante não chama a função');

reset role;

select * from finish();
rollback;
