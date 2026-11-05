begin;
select plan(14);

insert into auth.users (id, email) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'a@example.com');

-- O conteúdo da tabela (D3 e D5)
select is((select count(*)::int from public.category_map where is_visitable), 36, 'os 36 tipos visitáveis da D3 estão na tabela');
select is((select count(*)::int from public.category_map where is_sensitive), 29, 'os 16 tipos sensíveis da D5 e os 13 do ADR 0010 estão na tabela');
select is(
  (select count(*)::int from public.category_map where category_group = 'health' and is_sensitive),
  20,
  'os 20 tipos de saúde são sensíveis'
);
select results_eq(
  $$ select category, is_visitable, is_sensitive from public.category_map where overture_category = 'reproductive_perinatal_and_womens_care' $$,
  $$ values ('health_care', false, true) $$,
  'saúde da mulher é sensível e não é visitável'
);
select results_eq(
  $$ select overture_category::text from public.category_map where category_group = 'other_sensitive' and is_sensitive and not is_visitable order by 1 $$,
  $$ values ('adult_entertainment_venue'), ('labor_union'), ('political_organization'), ('psychic_advising') $$,
  'sindicato, política, entretenimento adulto e vidência são sensíveis e não são visitáveis'
);
select is_empty(
  $$ select overture_category from public.category_map where is_visitable and is_sensitive $$,
  'nenhum tipo é visitável e sensível ao mesmo tempo'
);
select results_eq(
  $$ select category, is_visitable, is_sensitive from public.category_map where overture_category = 'restaurant' $$,
  $$ values ('restaurant', true, false) $$,
  'restaurante é visitável e não é sensível'
);
select results_eq(
  $$ select category, is_visitable, is_sensitive from public.category_map where overture_category = 'christian_place_of_worship' $$,
  $$ values ('place_of_worship', false, true) $$,
  'igreja é sensível'
);
select is_empty(
  $$ select overture_category from public.category_map where overture_category in ('real_estate_service', 'attorney_or_law_firm') $$,
  'imobiliária e advocacia ficam de fora'
);

-- Sem login
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';

select throws_ok($$ select category from public.category_map $$, '42501', null, 'visitante não lê a tabela');

reset role;

-- Logado
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}';

select isnt_empty($$ select category from public.category_map $$, 'usuário lê a tabela');
select throws_ok(
  $$ insert into public.category_map (overture_category, category, category_group, is_visitable, is_sensitive) values ('x', 'x', 'culture', true, false) $$,
  '42501', null, 'usuário não cria linha'
);
select throws_ok($$ update public.category_map set is_sensitive = false $$, '42501', null, 'usuário não tira a marca de sensível');
select throws_ok($$ delete from public.category_map $$, '42501', null, 'usuário não apaga linha');

reset role;

select * from finish();
rollback;
