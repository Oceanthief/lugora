-- Visitas: os testes de aceitação 1 a 5 da seção 9.5 e as regras de publicação da seção 7.5.
begin;
select plan(49);

-- Começa sem as visitas e viagens de quem usou o app neste banco; o rollback do fim as devolve.
delete from public.visits;
delete from public.trips;

-- Pessoas: A registra; B não segue A; C segue A; D pediu para seguir e espera; N entrou, mas
-- não concluiu o cadastro (18+).
insert into auth.users (id, email) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'a@example.com'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'b@example.com'),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'c@example.com'),
  ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'd@example.com'),
  ('ffffffff-ffff-4fff-8fff-ffffffffffff', 'n@example.com');

insert into public.countries (id, name, iso_code, boundary) values
  ('99999999-0000-4000-8000-000000000000', 'Terra de Teste', 'ZZ', 'SRID=4326;MULTIPOLYGON(((0 0,0 1,1 1,1 0,0 0)))');

insert into public.cities (id, name, country_id, boundary, gers_id) values
  ('99999999-0000-4000-8000-000000000001', 'Cidade de Casa', '99999999-0000-4000-8000-000000000000', 'SRID=4326;MULTIPOLYGON(((0 0,0 1,1 1,1 0,0 0)))', 'test-home-city');

insert into public.profiles_private (user_id, home_city_id, age_confirmed_at)
select id, '99999999-0000-4000-8000-000000000001', now()
from (values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'::uuid),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc'::uuid),
  ('dddddddd-dddd-4ddd-8ddd-dddddddddddd'::uuid)
) as person (id);

insert into public.profiles (id, name, username) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Pessoa A', 'teste_a'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Pessoa B', 'teste_b'),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'Pessoa C', 'teste_c'),
  ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Pessoa D', 'teste_d');

insert into public.follows (follower_id, followee_id, status) values
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'active'),
  ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'pending');

insert into public.places (id, name, location, city_id, category, is_visitable, is_sensitive, status, gers_id) values
  ('88888888-0000-4000-8000-000000000001', 'Lanchonete de Teste', 'SRID=4326;POINT(0.5 0.5)', '99999999-0000-4000-8000-000000000001', null, true, false, 'active', 'test-snack'),
  ('88888888-0000-4000-8000-000000000002', 'Hospital de Teste', 'SRID=4326;POINT(0.5 0.5)', '99999999-0000-4000-8000-000000000001', 'hospital', false, true, 'active', 'test-hospital'),
  ('88888888-0000-4000-8000-000000000003', 'Condomínio de Teste', 'SRID=4326;POINT(0.5 0.5)', '99999999-0000-4000-8000-000000000001', 'residential', false, false, 'active', 'test-condo'),
  ('88888888-0000-4000-8000-000000000004', 'Lugar Pendente', 'SRID=4326;POINT(0.5 0.5)', '99999999-0000-4000-8000-000000000001', 'bar', true, false, 'pending', 'test-pending'),
  ('88888888-0000-4000-8000-000000000005', 'Lugar Fechado', 'SRID=4326;POINT(0.5 0.5)', '99999999-0000-4000-8000-000000000001', 'bar', true, false, 'closed', 'test-closed'),
  ('88888888-0000-4000-8000-000000000006', 'Serviço de Teste', 'SRID=4326;POINT(0.5 0.5)', '99999999-0000-4000-8000-000000000001', null, false, false, 'active', 'test-service');

-- Guarda o id de cada visita criada, para os testes seguintes.
create temporary table fx (label text primary key, id uuid, visibility text, publish_on date);
grant select, insert on fx to authenticated, anon;

select col_type_is('public', 'visits', 'rating', 'numeric(2,1)', 'a nota guarda uma casa decimal');
select col_type_is('public', 'visits', 'visited_on', 'date', 'a data da visita não tem hora');

-- A registra
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}';

insert into fx select 'a_publica', id, visibility, publish_on
from public.create_visit('88888888-0000-4000-8000-000000000001', current_date, 4.5, array['with_friends']);
insert into fx select 'a_sensivel', id, visibility, publish_on
from public.create_visit('88888888-0000-4000-8000-000000000002', current_date, 4, '{}');
insert into fx select 'a_sensivel_escolhida', id, visibility, publish_on
from public.create_visit('88888888-0000-4000-8000-000000000002', current_date, 3, '{}', 'public');
insert into fx select 'a_seguidores', id, visibility, publish_on
from public.create_visit('88888888-0000-4000-8000-000000000001', current_date - 1, 3.5, '{}', 'followers');
insert into fx select 'a_so_eu', id, visibility, publish_on
from public.create_visit('88888888-0000-4000-8000-000000000001', current_date - 2, 2, '{}', 'private');
insert into fx select 'a_fechado', id, visibility, publish_on
from public.create_visit('88888888-0000-4000-8000-000000000005', current_date, 4, '{}');
insert into fx select 'a_servico', id, visibility, publish_on
from public.create_visit('88888888-0000-4000-8000-000000000006', current_date, 4, '{}');

select is((select visibility from fx where label = 'a_publica'), 'public', 'sem escolher, vale o padrão do perfil: pública');
select is(
  (select publish_on from fx where label = 'a_publica'),
  (timezone('America/Sao_Paulo', now() + interval '24 hours'))::date,
  'Minha cidade: a visita aparece 24 h depois do registro, e a API só mostra a data'
);
select is((select visibility from fx where label = 'a_sensivel'), 'private', 'teste 5: lugar sensível salvo sem mexer na visibilidade nasce "só eu"');
select is((select visibility from fx where label = 'a_sensivel_escolhida'), 'public', 'quem escolhe de propósito pode publicar a visita a um lugar sensível');
select isnt_empty($$ select 1 from fx where label = 'a_fechado' $$, 'lugar fechado ainda recebe visita (D2)');
select isnt_empty($$ select 1 from fx where label = 'a_servico' $$, 'lugar fora da lista de visitáveis também recebe, com o aviso da tela');

-- O que o banco recusa
select throws_ok(
  $$ select public.create_visit('88888888-0000-4000-8000-000000000003', current_date, 4, '{}') $$,
  'P0001', 'place_not_visitable', 'condomínio não recebe visita (D3)'
);
select throws_ok(
  $$ select public.create_visit('88888888-0000-4000-8000-000000000004', current_date, 4, '{}') $$,
  'P0001', 'place_not_found', 'lugar pendente não recebe visita'
);
select throws_ok(
  $$ select public.create_visit('88888888-0000-4000-8000-000000000001', current_date + 2, 4, '{}') $$,
  'P0001', 'visited_on_in_future', 'a data da visita não pode ser futura'
);
select throws_ok(
  $$ select public.create_visit('88888888-0000-4000-8000-000000000001', current_date, 4.3, '{}') $$,
  '23514', null, 'a nota vai de meio em meio ponto'
);
select throws_ok(
  $$ select public.create_visit('88888888-0000-4000-8000-000000000001', current_date, 0, '{}') $$,
  '23514', null, 'a nota mínima é 0,5'
);
select throws_ok(
  $$ select public.create_visit('88888888-0000-4000-8000-000000000001', current_date, 5.5, '{}') $$,
  '23514', null, 'a nota máxima é 5'
);
select throws_ok(
  $$ select public.create_visit('88888888-0000-4000-8000-000000000001', current_date, 4, '{}', 'amigos') $$,
  '23514', null, 'a visibilidade só aceita pública, seguidores ou só eu'
);
select throws_ok(
  $$ insert into public.visits (user_id, place_id, visited_on, rating) values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '88888888-0000-4000-8000-000000000001', current_date, 4) $$,
  '42501', null, 'A não registra visita em nome de outra pessoa'
);
select throws_ok(
  $$ insert into public.visits (place_id, visited_on, rating, is_resident) values ('88888888-0000-4000-8000-000000000001', current_date, 4, false) $$,
  '42501', null, 'A não escolhe se é moradora'
);
select throws_ok(
  $$ insert into public.visits (place_id, visited_on, rating, publish_at) values ('88888888-0000-4000-8000-000000000001', current_date, 4, now() - interval '1 day') $$,
  '42501', null, 'A não escolhe quando a visita aparece'
);
select results_eq(
  $$ insert into public.visits (place_id, visited_on, rating) values ('88888888-0000-4000-8000-000000000002', current_date, 5) returning visibility $$,
  $$ values ('private') $$,
  'teste 5 pela API direto, sem a função de registro: o lugar sensível também nasce "só eu"'
);

-- As colunas que revelam a hora ou onde a pessoa mora não saem pela API, nem para a dona
select throws_ok($$ select publish_at from public.visits $$, '42501', null, 'a hora da publicação não sai pela API');
select throws_ok($$ select created_at from public.visits $$, '42501', null, 'a hora do registro não sai pela API');
select throws_ok($$ select is_resident from public.visits $$, '42501', null, 'se a pessoa é moradora não sai pela API');
select throws_ok($$ select trip_id from public.visits $$, '42501', null, 'a viagem não sai pela API');
select throws_ok($$ select * from public.visits $$, '42501', null, 'select * é recusado: só as colunas liberadas');
select throws_ok($$ select id from public.visits where publish_at > now() $$, '42501', null, 'nem como filtro');

select is((select count(*)::int from public.visits), 8, 'A vê todas as próprias visitas, inclusive as que ainda não apareceram');

select throws_ok($$ update public.visits set rating = 5 $$, '42501', null, 'a nota não muda pela API nesta fatia');
select throws_ok($$ delete from public.visits $$, '42501', null, 'nenhuma visita é apagada pela API nesta fatia');
select throws_ok(
  $$ update public.visits set publish_at = now() + interval '2 days' where id = (select id from fx where label = 'a_publica') $$,
  'P0001', 'publish_at_cannot_be_delayed', 'A não adia a publicação'
);

-- Teste 4: B, antes da hora
set local request.jwt.claims = '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}';

select is_empty(
  $$ select id from public.visits where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' $$,
  'teste 4: antes da hora, B não vê nem a visita pública de A'
);
select is(
  public.publish_visit_now((select id from fx where label = 'a_publica')),
  null,
  'B não publica a visita de A'
);
select is_empty(
  $$ update public.visits set publish_at = now() where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' returning id $$,
  'B não muda a publicação das visitas de A'
);

reset role;
set local request.jwt.claims = '';

select ok(
  (select publish_at > now() from public.visits where id = (select id from fx where label = 'a_publica')),
  'a visita de A continua esperando a hora'
);

-- "Publicar agora"
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}';

select is(
  public.publish_visit_now((select id from fx where label = 'a_publica')),
  (timezone('America/Sao_Paulo', now()))::date,
  '"publicar agora" traz a data de publicação para hoje'
);

set local request.jwt.claims = '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}';

select results_eq(
  $$ select id from public.visits where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' $$,
  $$ select id from fx where label = 'a_publica' $$,
  'depois de "publicar agora", B vê a visita na hora, e só ela'
);

-- O tempo passa: todas as visitas de A já apareceram
reset role;
set local request.jwt.claims = '';
update public.visits set publish_at = now() - interval '1 minute' where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

-- Testes 1 a 3: B não segue A
set local role authenticated;
set local request.jwt.claims = '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}';

select results_eq(
  $$ select fx.label from fx join public.visits as visit on visit.id = fx.id order by fx.label $$,
  $$ values ('a_fechado'), ('a_publica'), ('a_sensivel_escolhida'), ('a_servico') $$,
  'B vê só as visitas públicas de A: "só eu" e "seguidores" ficam de fora'
);
select is_empty(
  $$ select id from public.visits where id = (select id from fx where label = 'a_so_eu') $$,
  'teste 2: pedindo pelo id, B não recebe a visita "só eu" de A'
);
select is_empty(
  $$ select id from public.visits where id = (select id from fx where label = 'a_sensivel') $$,
  'teste 5: nem a visita ao lugar sensível'
);
select is_empty(
  $$ select id from public.visits where id = (select id from fx where label = 'a_seguidores') $$,
  'teste 3: B, que não segue A, não vê a visita "seguidores"'
);

-- C segue A
set local request.jwt.claims = '{"sub":"cccccccc-cccc-4ccc-8ccc-cccccccccccc","role":"authenticated"}';

select results_eq(
  $$ select fx.label from fx join public.visits as visit on visit.id = fx.id order by fx.label $$,
  $$ values ('a_fechado'), ('a_publica'), ('a_seguidores'), ('a_sensivel_escolhida'), ('a_servico') $$,
  'teste 3: C, que segue A, vê as públicas e a "seguidores"'
);
select is_empty(
  $$ select id from public.visits where id = (select id from fx where label = 'a_so_eu') $$,
  'teste 1: nem quem segue vê a visita "só eu"'
);

-- D pediu para seguir e espera
set local request.jwt.claims = '{"sub":"dddddddd-dddd-4ddd-8ddd-dddddddddddd","role":"authenticated"}';

select is_empty(
  $$ select id from public.visits where id = (select id from fx where label = 'a_seguidores') $$,
  'pedido pendente não libera a visita "seguidores"'
);

-- N entrou, mas não concluiu o cadastro
set local request.jwt.claims = '{"sub":"ffffffff-ffff-4fff-8fff-ffffffffffff","role":"authenticated"}';

select is_empty($$ select id from public.visits $$, 'quem não concluiu o cadastro (18+) não vê visitas de ninguém');

reset role;

-- Sem login
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';

select throws_ok($$ select id from public.visits $$, '42501', null, 'visitante não lê visitas');
select throws_ok(
  $$ select public.create_visit('88888888-0000-4000-8000-000000000001', current_date, 4, '{}') $$,
  '42501', null, 'visitante não registra visita'
);

reset role;

-- Visita já publicada não muda; e a publicação não vai para o passado
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}';

update public.visits set publish_at = now() where id = (select id from fx where label = 'a_seguidores');
insert into fx select 'a_nova', id, visibility, publish_on
from public.create_visit('88888888-0000-4000-8000-000000000001', current_date, 4, '{}');
update public.visits set publish_at = '2000-01-01' where id = (select id from fx where label = 'a_nova');

reset role;
set local request.jwt.claims = '';

select is(
  (select publish_at from public.visits where id = (select id from fx where label = 'a_seguidores')),
  now() - interval '1 minute',
  'uma visita já publicada não muda de data'
);
select is(
  (select publish_at from public.visits where id = (select id from fx where label = 'a_nova')),
  now(),
  'pôr a publicação no passado vira "agora", sem mudar a ordem do feed'
);
select results_eq(
  $$ select is_resident, trip_id from public.visits where id = (select id from fx where label = 'a_publica') $$,
  $$ values (true, null::uuid) $$,
  'na própria cidade, a visita é de moradora e não tem viagem'
);

-- O atraso vem de app_parameters, não do código
update public.app_parameters set value = '"48 hours"' where key = 'publish_delay_home';

set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}';

select is(
  (select publish_on from public.create_visit('88888888-0000-4000-8000-000000000001', current_date, 4, '{}')),
  (timezone('America/Sao_Paulo', now() + interval '48 hours'))::date,
  'mudar o parâmetro muda o atraso'
);

reset role;

select * from finish();
rollback;
