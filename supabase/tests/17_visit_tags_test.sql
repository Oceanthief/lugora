-- Etiquetas de cada visita (seção 7.8): até 3, só a dona põe, e quem vê a visita vê as etiquetas.
begin;
select plan(13);

insert into auth.users (id, email) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'a@example.com'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'b@example.com');

insert into public.countries (id, name, iso_code, boundary) values
  ('99999999-0000-4000-8000-000000000000', 'Terra de Teste', 'ZZ', 'SRID=4326;MULTIPOLYGON(((0 0,0 1,1 1,1 0,0 0)))');

insert into public.cities (id, name, country_id, boundary, gers_id) values
  ('99999999-0000-4000-8000-000000000001', 'Cidade de Casa', '99999999-0000-4000-8000-000000000000', 'SRID=4326;MULTIPOLYGON(((0 0,0 1,1 1,1 0,0 0)))', 'test-home-city');

insert into public.profiles_private (user_id, home_city_id, age_confirmed_at) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '99999999-0000-4000-8000-000000000001', now()),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '99999999-0000-4000-8000-000000000001', now());

insert into public.profiles (id, name, username) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Pessoa A', 'teste_a'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Pessoa B', 'teste_b');

insert into public.places (id, name, location, city_id, is_visitable, gers_id) values
  ('88888888-0000-4000-8000-000000000001', 'Lanchonete de Teste', 'SRID=4326;POINT(0.5 0.5)', '99999999-0000-4000-8000-000000000001', true, 'test-snack');

create temporary table fx (label text primary key, id uuid);
grant select, insert on fx to authenticated;

-- A registra
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}';

insert into fx select 'publica', id
from public.create_visit('88888888-0000-4000-8000-000000000001', current_date, 4.5, array['with_friends', 'cheap', 'with_friends']);
insert into fx select 'so_eu', id
from public.create_visit('88888888-0000-4000-8000-000000000001', current_date, 4, array['romantic'], 'private');

select results_eq(
  $$ select tag_id from public.visit_tags where visit_id = (select id from fx where label = 'publica') order by tag_id $$,
  $$ values ('cheap'), ('with_friends') $$,
  'a visita guarda as etiquetas escolhidas, sem repetir'
);
select is(
  (select count(*)::int from public.create_visit('88888888-0000-4000-8000-000000000001', current_date, 4, array['romantic', 'solo', 'geek'])),
  1,
  'três etiquetas cabem'
);

select is((select count(*)::int from public.visits), 3, 'antes da tentativa com 4 etiquetas, A tem 3 visitas');
select throws_ok(
  $$ select public.create_visit('88888888-0000-4000-8000-000000000001', current_date, 4, array['romantic', 'solo', 'geek', 'cheap']) $$,
  'P0001', 'too_many_tags', 'a quarta etiqueta é recusada'
);
select is((select count(*)::int from public.visits), 3, 'e a visita não fica gravada pela metade');
select throws_ok(
  $$ insert into public.visit_tags (visit_id, tag_id) values ((select id from fx where label = 'publica'), 'inventada') $$,
  null, null, 'etiqueta fora da lista é recusada'
);

reset role;
update public.tags set is_active = false where id = 'geek';
set local role authenticated;

select throws_ok(
  $$ insert into public.visit_tags (visit_id, tag_id) values ((select id from fx where label = 'publica'), 'geek') $$,
  '42501', null, 'etiqueta desativada não entra em visita nova'
);
select throws_ok($$ delete from public.visit_tags $$, '42501', null, 'etiqueta não é tirada pela API nesta fatia');

-- B
set local request.jwt.claims = '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}';

select throws_ok(
  $$ insert into public.visit_tags (visit_id, tag_id) values ((select id from fx where label = 'publica'), 'solo') $$,
  '42501', null, 'B não etiqueta a visita de A'
);
select is_empty($$ select tag_id from public.visit_tags $$, 'antes da hora, B não vê as etiquetas de A');

reset role;
set local request.jwt.claims = '';
update public.visits set publish_at = now() - interval '1 minute';

set local role authenticated;
set local request.jwt.claims = '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}';

select results_eq(
  $$ select tag_id from public.visit_tags where visit_id = (select id from fx where label = 'publica') order by tag_id $$,
  $$ values ('cheap'), ('with_friends') $$,
  'depois da publicação, B vê as etiquetas da visita pública'
);
select is_empty(
  $$ select tag_id from public.visit_tags where visit_id = (select id from fx where label = 'so_eu') $$,
  'B nunca vê as etiquetas de uma visita "só eu"'
);

reset role;

-- O limite vem de app_parameters
update public.app_parameters set value = '1' where key = 'visit_max_tags';

set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}';

select throws_ok(
  $$ select public.create_visit('88888888-0000-4000-8000-000000000001', current_date, 4, array['romantic', 'solo']) $$,
  'P0001', 'too_many_tags', 'mudar o parâmetro muda o limite'
);

reset role;

select * from finish();
rollback;
