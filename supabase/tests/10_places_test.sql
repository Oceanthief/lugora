begin;
select plan(16);

insert into auth.users (id, email) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'a@example.com');

insert into public.countries (id, name, iso_code, boundary) values
  ('99999999-0000-4000-8000-000000000000', 'Terra de Teste', 'ZZ', 'SRID=4326;MULTIPOLYGON(((0 0,0 1,1 1,1 0,0 0)))');

insert into public.cities (id, name, country_id, boundary, gers_id) values
  ('99999999-0000-4000-8000-000000000001', 'Cidade de Teste', '99999999-0000-4000-8000-000000000000', 'SRID=4326;MULTIPOLYGON(((0 0,0 1,1 1,1 0,0 0)))', 'test-city');

insert into public.places (id, name, location, city_id, is_visitable, status, gers_id) values
  ('88888888-0000-4000-8000-000000000001', 'Café São João d''Água', 'SRID=4326;POINT(0.5 0.5)', '99999999-0000-4000-8000-000000000001', true, 'active', 'test-active'),
  ('88888888-0000-4000-8000-000000000002', 'Lugar Fechado', 'SRID=4326;POINT(0.5 0.5)', '99999999-0000-4000-8000-000000000001', true, 'closed', 'test-closed'),
  ('88888888-0000-4000-8000-000000000003', 'Lugar Pendente', 'SRID=4326;POINT(0.5 0.5)', '99999999-0000-4000-8000-000000000001', true, 'pending', 'test-pending'),
  ('88888888-0000-4000-8000-000000000004', 'Lugar Mesclado', 'SRID=4326;POINT(0.5 0.5)', '99999999-0000-4000-8000-000000000001', true, 'merged', 'test-merged');

-- A estrutura
select is(
  (select search_name from public.places where id = '88888888-0000-4000-8000-000000000001'),
  'cafe sao joao d agua',
  'o nome normalizado é gerado sem acentos, maiúsculas nem pontuação'
);
select throws_ok(
  $$ insert into public.places (name, location, city_id, is_visitable, gers_id) values ('Repetido', 'SRID=4326;POINT(0 0)', '99999999-0000-4000-8000-000000000001', true, 'test-active') $$,
  '23505', null, 'o mesmo identificador do Overture não entra duas vezes'
);
select throws_ok(
  $$ insert into public.places (name, location, city_id, is_visitable, confidence) values ('Confiança errada', 'SRID=4326;POINT(0 0)', '99999999-0000-4000-8000-000000000001', true, 1.5) $$,
  '23514', null, 'a confiança fica entre 0 e 1'
);
select throws_ok(
  $$ insert into public.places (name, location, city_id, is_visitable, status) values ('Status errado', 'SRID=4326;POINT(0 0)', '99999999-0000-4000-8000-000000000001', true, 'inventado') $$,
  '23514', null, 'o status só aceita os valores previstos'
);
select hasnt_column('public', 'places', 'phone', 'a tabela não guarda telefone');
select hasnt_column('public', 'places', 'email', 'a tabela não guarda e-mail');

-- Sem login
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';

select throws_ok($$ select id from public.places $$, '42501', null, 'visitante não lê a tabela');

reset role;

-- Logado
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}';

select isnt_empty($$ select id from public.places where gers_id = 'test-active' $$, 'usuário lê lugar ativo');
select isnt_empty($$ select id from public.places where gers_id = 'test-closed' $$, 'usuário lê lugar fechado, que fica no histórico');
select is_empty($$ select id from public.places where gers_id = 'test-pending' $$, 'lugar pendente não aparece');
select is_empty($$ select id from public.places where gers_id = 'test-merged' $$, 'lugar mesclado não aparece');
select throws_ok(
  $$ insert into public.places (name, location, city_id, is_visitable) values ('Novo', 'SRID=4326;POINT(0 0)', '99999999-0000-4000-8000-000000000001', true) $$,
  '42501', null, 'usuário não cria lugar pela API'
);
select throws_ok($$ update public.places set name = 'Hackeado' where gers_id = 'test-active' $$, '42501', null, 'usuário não altera lugar');
select throws_ok($$ update public.places set is_sensitive = false $$, '42501', null, 'usuário não tira a marca de sensível');
select throws_ok($$ delete from public.places where gers_id = 'test-active' $$, '42501', null, 'usuário não apaga lugar');

reset role;

select results_eq(
  $$ select name from public.places where gers_id = 'test-active' $$,
  $$ values ('Café São João d''Água') $$,
  'o lugar continua igual depois das tentativas'
);

select * from finish();
rollback;
