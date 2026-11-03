begin;
select plan(12);

insert into auth.users (id, email) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'a@example.com'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'b@example.com');

insert into public.consents (user_id, purpose, policy_version, granted) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'essential', 'teste', true),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'analytics', 'teste', true),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'essential', 'teste', true);

-- Pessoa A logada
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}';

select results_eq(
  $$ select purpose from public.consents where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' order by purpose $$,
  $$ values ('analytics'), ('essential') $$,
  'A lê os próprios consentimentos'
);
select is_empty(
  $$ select id from public.consents where user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' $$,
  'A não lê os consentimentos de B'
);
select lives_ok(
  $$ insert into public.consents (user_id, purpose, policy_version, granted) values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'emails', 'teste', false) $$,
  'A registra um consentimento próprio'
);
select throws_ok(
  $$ insert into public.consents (user_id, purpose, policy_version, granted) values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'emails', 'teste', true) $$,
  '42501', null, 'A não registra consentimento em nome de B'
);
select throws_ok(
  $$ insert into public.consents (user_id, purpose, policy_version, granted) values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'analytics', 'teste', false) $$,
  '23505', null, 'só existe um registro por finalidade e versão'
);
select results_eq(
  $$ update public.consents set granted = false where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' and purpose = 'analytics' returning granted $$,
  $$ values (false) $$,
  'A retira um consentimento opcional'
);
select is_empty(
  $$ update public.consents set granted = false where user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' returning id $$,
  'A não altera os consentimentos de B'
);
select throws_ok(
  $$ update public.consents set purpose = 'emails' where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' and purpose = 'analytics' $$,
  '42501', null, 'A não troca a finalidade de um registro'
);
select throws_ok(
  $$ update public.consents set granted = false where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' and purpose = 'essential' $$,
  '23514', null, 'o aceite essencial não vira "não"'
);
select is_empty(
  $$ delete from public.consents where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' returning id $$,
  'A não apaga a prova do próprio aceite'
);
select is_empty(
  $$ delete from public.consents where user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' returning id $$,
  'A não apaga os consentimentos de B'
);

reset role;

-- Sem login
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';

select throws_ok(
  $$ select id from public.consents $$,
  '42501', null, 'visitante não lê consentimentos'
);

reset role;

select * from finish();
rollback;
