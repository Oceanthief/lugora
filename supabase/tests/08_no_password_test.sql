-- O Lugora não usa senha (ADR 0009). Uma senha guardada deixaria alguém entrar na conta de
-- outra pessoa, mesmo depois de a dona do e-mail confirmar com o código.
begin;
select plan(3);

insert into auth.users (id, email, encrypted_password) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'a@example.com', 'hash-de-uma-senha');

select is(
  (select encrypted_password from auth.users where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  null::character varying,
  'a senha informada ao criar a conta é descartada'
);

update auth.users
set encrypted_password = 'hash-de-outra-senha'
where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

select is(
  (select encrypted_password from auth.users where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  null::character varying,
  'a senha informada depois também é descartada'
);

update auth.users
set email = 'novo@example.com'
where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

select is(
  (select email from auth.users where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  'novo@example.com'::character varying,
  'o resto da conta continua sendo atualizado'
);

select * from finish();
rollback;
