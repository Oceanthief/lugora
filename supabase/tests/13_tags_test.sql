-- Etiquetas (seção 7.8): lista fixa, só leitura pela API.
begin;
select plan(9);

insert into auth.users (id, email) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'a@example.com');

select results_eq(
  $$ select kind, count(*)::int from public.tags group by kind order by kind $$,
  $$ values ('attribute', 2), ('occasion', 5), ('theme', 5) $$,
  'a lista inicial tem 5 ocasiões, 5 temas e 2 atributos'
);
select results_eq(
  $$ select id from public.tags where kind = 'occasion' order by id $$,
  $$ values ('romantic'), ('solo'), ('with_family'), ('with_friends'), ('work_study') $$,
  'as ocasiões são as mesmas da tela de registro'
);
select throws_ok(
  $$ insert into public.tags (id, kind) values ('Com Espaço', 'occasion') $$,
  '23514', null, 'o código da etiqueta só tem minúsculas e _'
);

-- Logado
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}';

select is((select count(*)::int from public.tags), 12, 'quem está logado lê a lista inteira');
select throws_ok($$ insert into public.tags (id, kind) values ('nova', 'theme') $$, '42501', null, 'ninguém cria etiqueta pela API');
select throws_ok($$ update public.tags set is_active = false $$, '42501', null, 'ninguém desativa etiqueta pela API');
select throws_ok($$ delete from public.tags $$, '42501', null, 'ninguém apaga etiqueta pela API');

reset role;

select is((select count(*)::int from public.tags where is_active), 12, 'as etiquetas continuam ativas depois das tentativas');

-- Sem login
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';

select throws_ok($$ select id from public.tags $$, '42501', null, 'visitante não lê a lista');

reset role;

select * from finish();
rollback;
