begin;
select plan(6);

insert into auth.users (id, email) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'a@example.com');

set local role anon;
set local request.jwt.claims = '{"role":"anon"}';

select isnt_empty($$ select key from public.app_parameters where key = 'privacy_policy_version' $$, 'visitante lê os parâmetros');

reset role;

set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}';

select isnt_empty($$ select key from public.app_parameters where key = 'privacy_policy_version' $$, 'usuário lê os parâmetros');
select throws_ok(
  $$ insert into public.app_parameters (key, value, description) values ('x', '1', 'x') $$,
  '42501', null, 'usuário não cria parâmetro'
);
select is_empty($$ update public.app_parameters set value = '"x"' where key = 'privacy_policy_version' returning key $$, 'usuário não altera parâmetro');
select is_empty($$ delete from public.app_parameters where key = 'privacy_policy_version' returning key $$, 'usuário não apaga parâmetro');

reset role;

select isnt(
  (select value #>> '{}' from public.app_parameters where key = 'privacy_policy_version'),
  'x',
  'o parâmetro continua igual depois das tentativas'
);

select * from finish();
rollback;
