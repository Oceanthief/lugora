-- Seguir, só o mínimo da Fatia 4: cada pessoa vê as próprias relações, e a API não escreve nada.
begin;
select plan(10);

insert into auth.users (id, email) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'a@example.com'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'b@example.com'),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'c@example.com');

insert into public.profiles (id, name, username) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Pessoa A', 'teste_a'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Pessoa B', 'teste_b'),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'Pessoa C', 'teste_c');

-- C segue A; B pediu para seguir A e ainda espera.
insert into public.follows (follower_id, followee_id, status) values
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'active'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'pending');

select throws_ok(
  $$ insert into public.follows (follower_id, followee_id) values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') $$,
  '23514', null, 'ninguém segue a si mesmo'
);
select throws_ok(
  $$ insert into public.follows (follower_id, followee_id, status) values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'blocked') $$,
  '23514', null, 'o status só aceita ativo ou pendente'
);

-- A, que é seguida
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}';

select is((select count(*)::int from public.follows), 2, 'A vê quem a segue e quem pediu');

-- B, que pediu
set local request.jwt.claims = '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}';

select results_eq(
  $$ select followee_id, status from public.follows $$,
  $$ values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid, 'pending') $$,
  'B vê só o próprio pedido, não que C segue A'
);
select throws_ok(
  $$ insert into public.follows (follower_id, followee_id) values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc') $$,
  '42501', null, 'B não segue ninguém pela API nesta fatia'
);
select throws_ok(
  $$ update public.follows set status = 'active' $$,
  '42501', null, 'B não aprova o próprio pedido'
);
select throws_ok(
  $$ delete from public.follows $$,
  '42501', null, 'B não apaga relações pela API nesta fatia'
);
select throws_ok(
  $$ select created_at from public.follows $$,
  '42501', null, 'a hora em que alguém seguiu não sai pela API'
);

reset role;

select results_eq(
  $$ select follower_id, status from public.follows where followee_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' order by status $$,
  $$ values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc'::uuid, 'active'), ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'::uuid, 'pending') $$,
  'as relações continuam iguais depois das tentativas'
);

-- Sem login
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';

select throws_ok($$ select follower_id from public.follows $$, '42501', null, 'visitante não lê quem segue quem');

reset role;

select * from finish();
rollback;
