-- Viagens (seção 7.5): as visitas fora de casa aparecem quando a viagem encerra, pela pessoa
-- ou sozinha, 3 dias depois do último registro fora da cidade de residência.
begin;
select plan(28);

-- G mora na Cidade Distante e viaja para a Cidade de Casa. A mora na Cidade de Casa. B observa.
insert into auth.users (id, email) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'a@example.com'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'b@example.com'),
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'g@example.com');

insert into public.countries (id, name, iso_code, boundary) values
  ('99999999-0000-4000-8000-000000000000', 'Terra de Teste', 'ZZ', 'SRID=4326;MULTIPOLYGON(((0 0,0 1,1 1,1 0,0 0)))');

insert into public.cities (id, name, country_id, boundary, gers_id) values
  ('99999999-0000-4000-8000-000000000001', 'Cidade de Casa', '99999999-0000-4000-8000-000000000000', 'SRID=4326;MULTIPOLYGON(((0 0,0 1,1 1,1 0,0 0)))', 'test-home-city'),
  ('99999999-0000-4000-8000-000000000002', 'Cidade Distante', '99999999-0000-4000-8000-000000000000', 'SRID=4326;MULTIPOLYGON(((2 2,2 3,3 3,3 2,2 2)))', 'test-far-city');

insert into public.profiles_private (user_id, home_city_id, age_confirmed_at) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '99999999-0000-4000-8000-000000000001', now()),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '99999999-0000-4000-8000-000000000001', now()),
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', '99999999-0000-4000-8000-000000000002', now());

insert into public.profiles (id, name, username) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Pessoa A', 'teste_a'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Pessoa B', 'teste_b'),
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'Pessoa G', 'teste_g');

insert into public.places (id, name, location, city_id, is_visitable, gers_id) values
  ('88888888-0000-4000-8000-000000000001', 'Lanchonete da Cidade de Casa', 'SRID=4326;POINT(0.5 0.5)', '99999999-0000-4000-8000-000000000001', true, 'test-home-snack'),
  ('88888888-0000-4000-8000-000000000002', 'Café da Cidade Distante', 'SRID=4326;POINT(2.5 2.5)', '99999999-0000-4000-8000-000000000002', true, 'test-far-cafe');

create temporary table fx (label text primary key, id uuid, publish_on date);
grant select, insert on fx to authenticated, anon;

-- G chega à Cidade de Casa
set local role authenticated;
set local request.jwt.claims = '{"sub":"eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee","role":"authenticated"}';

insert into fx select 'g1', id, publish_on
from public.create_visit('88888888-0000-4000-8000-000000000001', current_date, 4, '{}');

select is(
  (select publish_on from fx where label = 'g1'),
  (timezone('America/Sao_Paulo', now() + interval '3 days'))::date,
  'fora de casa, a visita espera a viagem encerrar: 3 dias depois do último registro'
);
select is((select count(*)::int from public.trips), 1, 'a visita fora de casa abre uma viagem');
select is((select closes_at from public.trips), now() + interval '3 days', 'a viagem encerra sozinha 3 dias depois');

-- Uma visita registrada em casa não mexe na viagem
insert into fx select 'g_casa', id, publish_on
from public.create_visit('88888888-0000-4000-8000-000000000002', current_date, 5, '{}');

select is(
  (select publish_on from fx where label = 'g_casa'),
  (timezone('America/Sao_Paulo', now() + interval '24 hours'))::date,
  'em casa, vale o atraso de 24 h, mesmo com uma viagem aberta'
);

-- O tempo passa: a viagem começou há 2 dias e encerraria amanhã
reset role;
set local request.jwt.claims = '';
update public.trips set closes_at = now() + interval '1 day';

select is(
  (select publish_at from public.visits where id = (select id from fx where label = 'g1')),
  now() + interval '1 day',
  'a visita acompanha o encerramento da viagem'
);

-- Segunda visita fora de casa
set local role authenticated;
set local request.jwt.claims = '{"sub":"eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee","role":"authenticated"}';

insert into fx select 'g2', id, publish_on
from public.create_visit('88888888-0000-4000-8000-000000000001', current_date, 3, '{}');

select is((select count(*)::int from public.trips), 1, 'a segunda visita fora de casa entra na mesma viagem');

reset role;
set local request.jwt.claims = '';

select results_eq(
  $$ select publish_at from public.visits where id in (select id from fx where label in ('g1', 'g2')) $$,
  $$ values (now() + interval '3 days'), (now() + interval '3 days') $$,
  'cada visita nova fora de casa adia as que ainda não apareceram'
);
select results_eq(
  $$ select visit.is_resident, visit.trip_id = trip.id from public.visits as visit cross join public.trips as trip where visit.id = (select id from fx where label = 'g2') $$,
  $$ values (false, true) $$,
  'fora de casa, a visita é de visitante e fica dentro da viagem'
);

-- "Publicar agora" uma visita da viagem; a próxima visita não a faz voltar a esperar
set local role authenticated;
set local request.jwt.claims = '{"sub":"eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee","role":"authenticated"}';

select public.publish_visit_now((select id from fx where label = 'g1'));
insert into fx select 'g3', id, publish_on
from public.create_visit('88888888-0000-4000-8000-000000000001', current_date, 4.5, '{}');

reset role;
set local request.jwt.claims = '';

select is(
  (select publish_at from public.visits where id = (select id from fx where label = 'g1')),
  now(),
  'uma visita publicada na hora não volta a esperar'
);

-- B, enquanto a viagem está aberta
set local role authenticated;
set local request.jwt.claims = '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}';

select results_eq(
  $$ select id from public.visits where user_id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee' $$,
  $$ select id from fx where label = 'g1' $$,
  'durante a viagem, B vê só a visita que G publicou na hora'
);

-- A não mexe na viagem de G
set local request.jwt.claims = '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}';

select is_empty($$ select id from public.trips $$, 'ninguém vê a viagem de outra pessoa');

reset role;
set local request.jwt.claims = '';

create temporary table g_trip as select id from public.trips;
grant select on g_trip to authenticated, anon;

set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}';

select public.close_trip((select id from g_trip));

reset role;

select ok((select closes_at > now() from public.trips), 'A não encerra a viagem de G');

-- G não adia, não cria nem apaga viagem
set local role authenticated;
set local request.jwt.claims = '{"sub":"eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee","role":"authenticated"}';

select throws_ok(
  $$ update public.trips set closes_at = now() + interval '10 days' $$,
  'P0001', 'trip_cannot_be_extended', 'G não adia a própria viagem'
);
select throws_ok(
  $$ insert into public.trips (user_id, closes_at) values ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', now() + interval '30 days') $$,
  '42501', null, 'viagem não é criada pela API'
);
select throws_ok($$ delete from public.trips $$, '42501', null, 'viagem não é apagada pela API');
select throws_ok($$ select created_at from public.trips $$, '42501', null, 'a hora em que a viagem começou não sai pela API');

-- "Encerrar viagem"
select public.close_trip((select id from g_trip));

reset role;
set local request.jwt.claims = '';

select is((select closes_at from public.trips), now(), '"Encerrar viagem" encerra agora');
select results_eq(
  $$ select publish_at from public.visits where id in (select id from fx where label in ('g2', 'g3')) $$,
  $$ values (now()), (now()) $$,
  'encerrar a viagem publica as visitas dela'
);

set local role authenticated;
set local request.jwt.claims = '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}';

select results_eq(
  $$ select id from public.visits where user_id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee' order by id $$,
  $$ select id from fx where label in ('g1', 'g2', 'g3') order by id $$,
  'com a viagem encerrada, B vê as visitas dela'
);

-- Depois de encerrada
set local request.jwt.claims = '{"sub":"eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee","role":"authenticated"}';

update public.trips set closes_at = now() - interval '5 days' where id = (select id from g_trip);
insert into fx select 'g4', id, publish_on
from public.create_visit('88888888-0000-4000-8000-000000000001', current_date, 4, '{}');

select is((select count(*)::int from public.trips), 2, 'depois de encerrada, a próxima visita fora de casa abre outra viagem');

reset role;
set local request.jwt.claims = '';

select is(
  (select closes_at from public.trips where id = (select id from g_trip)),
  now(),
  'uma viagem encerrada não muda de data'
);

-- Encerramento sozinho: passam 3 dias sem registro fora de casa
update public.trips set closes_at = now() - interval '1 minute' where id <> (select id from g_trip);

select is(
  (select publish_at from public.visits where id = (select id from fx where label = 'g4')),
  now() - interval '1 minute',
  'quando o prazo passa, as visitas da viagem aparecem sem ninguém fazer nada'
);

set local role authenticated;
set local request.jwt.claims = '{"sub":"eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee","role":"authenticated"}';

select public.create_visit('88888888-0000-4000-8000-000000000001', current_date, 4, '{}');

select is((select count(*)::int from public.trips), 3, 'viagem encerrada sozinha não recebe mais visitas: abre-se outra');

-- A também viaja: a Cidade Distante é fora de casa para ela
set local request.jwt.claims = '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}';

select public.create_visit('88888888-0000-4000-8000-000000000002', current_date, 4, '{}');

reset role;
set local request.jwt.claims = '';

select throws_ok(
  $$ update public.visits set trip_id = (select id from public.trips where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')
     where id = (select id from fx where label = 'g2') $$,
  '23503', null, 'uma visita não entra na viagem de outra pessoa'
);
select throws_ok(
  $$ update public.visits set trip_id = null where id = (select id from fx where label = 'g2') $$,
  '23514', null, 'visita fora de casa sempre tem viagem'
);

-- O prazo vem de app_parameters, não do código
update public.app_parameters set value = '"5 days"' where key = 'trip_auto_close_after';

set local role authenticated;
set local request.jwt.claims = '{"sub":"eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee","role":"authenticated"}';

select is(
  (select publish_on from public.create_visit('88888888-0000-4000-8000-000000000001', current_date, 4, '{}')),
  (timezone('America/Sao_Paulo', now() + interval '5 days'))::date,
  'mudar o parâmetro muda o prazo da viagem'
);

reset role;

-- Sem login
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';

select throws_ok($$ select public.close_trip((select id from g_trip)) $$, '42501', null, 'visitante não encerra viagem');
select throws_ok($$ select id from public.trips $$, '42501', null, 'visitante não lê viagens');

reset role;

select * from finish();
rollback;
