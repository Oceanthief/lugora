-- "Lugares perto de mim": só com o consentimento de localização, só lugares para visitar, no raio.
begin;
select plan(9);

-- A consentiu; B nunca respondeu; C consentiu e retirou depois.
insert into auth.users (id, email) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'a@example.com'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'b@example.com'),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'c@example.com');

insert into public.consents (user_id, purpose, policy_version, granted, created_at) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'precise_location', 'teste-1', true, now()),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'precise_location', 'teste-1', true, now() - interval '2 days'),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'precise_location', 'teste-2', false, now() - interval '1 day');

insert into public.countries (id, name, iso_code, boundary) values
  ('99999999-0000-4000-8000-000000000000', 'Terra de Teste', 'ZZ', 'SRID=4326;MULTIPOLYGON(((0 0,0 1,1 1,1 0,0 0)))');

insert into public.cities (id, name, country_id, boundary, gers_id) values
  ('99999999-0000-4000-8000-000000000001', 'Cidade de Teste', '99999999-0000-4000-8000-000000000000', 'SRID=4326;MULTIPOLYGON(((0 0,0 1,1 1,1 0,0 0)))', 'test-city');

-- A pessoa está em (0,5; 0,5). 0,001 grau perto do equador é cerca de 111 m.
insert into public.places (name, location, city_id, is_visitable, status, gers_id) values
  ('Café a 55 m', 'SRID=4326;POINT(0.5005 0.5)', '99999999-0000-4000-8000-000000000001', true, 'active', 'near-cafe'),
  ('Bar a 111 m', 'SRID=4326;POINT(0.501 0.5)', '99999999-0000-4000-8000-000000000001', true, 'active', 'near-bar'),
  ('Escritório a 20 m', 'SRID=4326;POINT(0.5002 0.5)', '99999999-0000-4000-8000-000000000001', false, 'active', 'near-office'),
  ('Bar pendente a 30 m', 'SRID=4326;POINT(0.5003 0.5)', '99999999-0000-4000-8000-000000000001', true, 'pending', 'near-pending'),
  ('Parque a 1,1 km', 'SRID=4326;POINT(0.51 0.5)', '99999999-0000-4000-8000-000000000001', true, 'active', 'far-park');

set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}';

select results_eq(
  $$ select name from public.nearby_places(0.5, 0.5) $$,
  $$ values ('Café a 55 m'), ('Bar a 111 m') $$,
  'traz só os lugares para visitar no raio, do mais perto para o mais longe'
);
select ok(
  (select distance_meters between 50 and 60 from public.nearby_places(0.5, 0.5) limit 1),
  'a distância vem em metros'
);
select is_empty($$ select id from public.nearby_places(999, 999) $$, 'uma posição impossível não traz nada, sem erro');

-- Sem o consentimento
set local request.jwt.claims = '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}';
select is_empty($$ select id from public.nearby_places(0.5, 0.5) $$, 'quem nunca consentiu não recebe nada (seção 9.1)');

set local request.jwt.claims = '{"sub":"cccccccc-cccc-4ccc-8ccc-cccccccccccc","role":"authenticated"}';
select is_empty($$ select id from public.nearby_places(0.5, 0.5) $$, 'vale a resposta mais recente: quem retirou não recebe nada');

reset role;

-- O raio e a quantidade vêm de app_parameters
update public.app_parameters set value = '2000' where key = 'nearby_places_radius_meters';

set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}';
select is((select count(*)::int from public.nearby_places(0.5, 0.5)), 3, 'um raio maior traz o parque');

reset role;
update public.app_parameters set value = '1' where key = 'nearby_places_limit';

set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}';
select results_eq($$ select name from public.nearby_places(0.5, 0.5) $$, $$ values ('Café a 55 m') $$, 'o limite também');

select is_empty(
  $$ select 1 from information_schema.routines where routine_schema = 'public' and routine_name = 'nearby_places' and security_type = 'DEFINER' $$,
  'a função roda com as permissões de quem chama'
);

reset role;

-- Sem login
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
select throws_ok($$ select id from public.nearby_places(0.5, 0.5) $$, '42501', null, 'visitante não usa a função');

reset role;

select * from finish();
rollback;
