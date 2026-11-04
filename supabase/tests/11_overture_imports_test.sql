begin;
select plan(5);

insert into auth.users (id, email) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'a@example.com');

insert into public.overture_imports (release, added) values ('teste', 1);

select isnt_empty($$ select id from public.overture_imports where release = 'teste' $$, 'o pipeline registra a execução');

set local role anon;
set local request.jwt.claims = '{"role":"anon"}';

select throws_ok($$ select id from public.overture_imports $$, '42501', null, 'visitante não lê as importações');

reset role;

set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}';

select throws_ok($$ select id from public.overture_imports $$, '42501', null, 'usuário não lê as importações');
select throws_ok($$ insert into public.overture_imports (release) values ('falsa') $$, '42501', null, 'usuário não registra importação');
select throws_ok($$ delete from public.overture_imports $$, '42501', null, 'usuário não apaga importação');

reset role;

select * from finish();
rollback;
