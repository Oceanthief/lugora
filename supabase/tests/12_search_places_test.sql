-- Critérios de aceite da Fatia 3, com os nomes reais do diagnóstico de Juiz de Fora.
begin;
select plan(24);

-- Tudo some no rollback do fim: assim, o teste não depende de a base já estar carregada.
delete from public.places;

insert into auth.users (id, email) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'a@example.com');

insert into public.countries (id, name, iso_code, boundary) values
  ('99999999-0000-4000-8000-000000000000', 'Terra de Teste', 'ZZ', 'SRID=4326;MULTIPOLYGON(((0 0,0 1,1 1,1 0,0 0)))');

insert into public.cities (id, name, country_id, boundary, gers_id) values
  ('99999999-0000-4000-8000-000000000001', 'Cidade de Teste', '99999999-0000-4000-8000-000000000000', 'SRID=4326;MULTIPOLYGON(((0 0,0 1,1 1,1 0,0 0)))', 'test-city');

insert into public.places (name, location, address, city_id, category, category_override, is_visitable, confidence, status, gers_id)
select name, ('SRID=4326;POINT(' || lng || ' ' || lat || ')')::extensions.geography, address, '99999999-0000-4000-8000-000000000001', category, category_override, is_visitable, confidence, status, gers_id
from (values
  ('Poleiro do Galo', -43.36143, -21.75152, 'R. Catulo Breviglieri, 800', 'restaurant', null, true, 0.98, 'active', 'poleiro-1'),
  ('Poleiro do Galo', -43.3523, -21.77204, 'Rua Manoel Bernardino, 8', 'restaurant', null, true, 0.98, 'active', 'poleiro-2'),
  ('Igreja do Evangelho Casa do Oleiro', -43.35, -21.76, 'Rua C, 3', 'place_of_worship', null, false, 0.96, 'active', 'oleiro'),
  ('Açougue do Cordeiro', -43.35, -21.76, 'Rua D, 4', null, null, false, 0.98, 'active', 'cordeiro'),
  ('Viva Gula', -43.35133, -21.75802, 'Rua Santo Antônio, 537', 'restaurant', null, true, 0.41, 'active', 'viva-gula'),
  ('Gula da Pipoca', -43.35, -21.76, 'Rua E, 5', 'casual_eatery', null, true, 0.45, 'active', 'gula-pipoca'),
  ('Santiago Lanches', -43.35912, -21.74833, 'Avenida dos Andradas, 1235', null, null, true, 0.29, 'active', 'santiago-lanches'),
  ('Santiago Advogados', -43.35, -21.76, 'Rua F, 6', null, null, false, 0.73, 'active', 'santiago-advogados'),
  ('bardosantiago', -43.35, -21.76, null, null, null, true, 0.36, 'active', 'santiago-bar'),
  ('Restaurante Universitário da UFJF', -43.35, -21.76, 'Rua G, 7', null, null, true, 0.86, 'active', 'ru-ufjf'),
  ('Condomínio do Edifício São Lucas', -43.35, -21.76, 'Rua H, 8', 'residential', null, false, 0.95, 'active', 'condominio'),
  ('Café Corrigido', -43.35, -21.76, 'Rua I, 9', 'cafe', 'bakery', true, 0.5, 'active', 'corrigido'),
  ('Lugar Fechado', -43.35, -21.76, 'Rua J, 10', 'bar', null, true, 0.9, 'closed', 'fechado'),
  ('Lugar Pendente', -43.35, -21.76, 'Rua K, 11', 'bar', null, true, 0.9, 'pending', 'pendente'),
  ('Lugar Mesclado', -43.35, -21.76, 'Rua L, 12', 'bar', null, true, 0.9, 'merged', 'mesclado')
) as fixture (name, lng, lat, address, category, category_override, is_visitable, confidence, status, gers_id);

insert into public.places (name, location, city_id, is_visitable, gers_id)
select 'Limite ' || n, 'SRID=4326;POINT(0 0)', '99999999-0000-4000-8000-000000000001', true, 'limite-' || n
from generate_series(1, 12) as n;

set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}';

-- Critérios de aceite
select results_eq(
  $$ select name, address from public.search_places('poleiro') order by address $$,
  $$ values ('Poleiro do Galo', 'R. Catulo Breviglieri, 800'), ('Poleiro do Galo', 'Rua Manoel Bernardino, 8') $$,
  '"poleiro" traz só as 2 unidades, com endereços diferentes'
);
select results_eq(
  $$ select name from public.search_places('viva gula') $$,
  $$ values ('Viva Gula') $$,
  '"viva gula" traz 1 resultado'
);
select results_eq(
  $$ select name, address from public.search_places('santiago lanches') $$,
  $$ values ('Santiago Lanches', 'Avenida dos Andradas, 1235') $$,
  'o Santiago Lanches, de confiança 0,29, aparece pelo nome'
);
select results_eq(
  $$ select name, is_visitable, category from public.search_places('condominio') $$,
  $$ values ('Condomínio do Edifício São Lucas', false, 'residential') $$,
  'um condomínio aparece pelo nome, mas não como visitável'
);

-- A ordenação
select results_eq(
  $$ select name from public.search_places('santiago') $$,
  $$ values ('Santiago Lanches'), ('Santiago Advogados') $$,
  'sem posição: no empate do texto, o visitável vem antes do serviço'
);
select results_eq(
  $$ select name from public.search_places('santiago', -21.76, -43.35) $$,
  $$ values ('Santiago Lanches'), ('Santiago Advogados') $$,
  'com posição: o visitável vem antes, mesmo com o serviço mais perto'
);
select results_eq(
  $$ select address from public.search_places('poleiro', -21.77204, -43.3523) $$,
  $$ values ('Rua Manoel Bernardino, 8'), ('R. Catulo Breviglieri, 800') $$,
  'no empate, a unidade mais perto vem primeiro'
);
select results_eq(
  $$ select address from public.search_places('poleiro', -21.75152, -43.36143) $$,
  $$ values ('R. Catulo Breviglieri, 800'), ('Rua Manoel Bernardino, 8') $$,
  'de outro ponto, a ordem das unidades se inverte'
);
select results_eq(
  $$ select name from public.search_places('gula') $$,
  $$ values ('Gula da Pipoca'), ('Viva Gula') $$,
  'sem posição, a confiança desempata'
);

-- A distância
select ok(
  (select distance_meters between 2400 and 2600 from public.search_places('poleiro', -21.77204, -43.3523) offset 1 limit 1),
  'a distância entre as unidades fica perto de 2,5 km'
);
select is(
  (select count(*)::int from public.search_places('poleiro') where distance_meters is not null),
  0,
  'sem posição, nenhum resultado traz distância'
);
select is(
  (select count(*)::int from public.search_places('poleiro', 999, 999) where distance_meters is not null),
  0,
  'uma posição impossível é ignorada, sem erro'
);

-- Encontrar pelo que a pessoa digita
select is((select count(*)::int from public.search_places('POLEIRO')), 2, 'ignora maiúsculas');
select results_eq(
  $$ select name from public.search_places('universitario da ufjf') $$,
  $$ values ('Restaurante Universitário da UFJF') $$,
  'ignora acentos e acha pelo meio do nome'
);
select is((select count(*)::int from public.search_places('poleito') where name = 'Poleiro do Galo'), 2, 'tolera erro de digitação');
select is((select name from public.search_places('poleito') limit 1), 'Poleiro do Galo', 'o nome certo vem antes do que só se parece');
select results_eq(
  $$ select name from public.search_places('vivagula') $$,
  $$ values ('Viva Gula') $$,
  'acha mesmo sem o espaço'
);

-- O que não deve aparecer
select is_empty($$ select id from public.search_places('lugar') where name in ('Lugar Fechado', 'Lugar Pendente', 'Lugar Mesclado') $$, 'lugar fechado, pendente ou mesclado não aparece');
select is((select count(*)::int from public.search_places('limite')), 10, 'devolve no máximo 10 lugares');
select is_empty($$ select id from public.search_places('a') $$, 'uma letra só não busca');
select is_empty($$ select id from public.search_places('%%') $$, '% não funciona como curinga');

-- A categoria corrigida vale mais que a do Overture (D3)
select is((select category from public.search_places('cafe corrigido')), 'bakery', 'a correção do usuário tem prioridade');

reset role;

-- Os limites vêm de app_parameters, não do código
update public.app_parameters set value = '0.5' where key = 'place_search_strong_similarity';

set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}';

select ok(
  (select count(*) > 2 from public.search_places('poleiro')),
  'mudar o parâmetro muda o resultado'
);

reset role;

-- Sem login
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';

select throws_ok($$ select id from public.search_places('poleiro') $$, '42501', null, 'visitante não usa a busca');

reset role;

select * from finish();
rollback;
