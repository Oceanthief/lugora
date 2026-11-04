-- Regras que valem para o banco inteiro, inclusive para tabelas das próximas fatias.
begin;
select plan(8);

select is_empty(
  $$ select tablename from pg_catalog.pg_tables where schemaname = 'public' and not rowsecurity $$,
  'toda tabela do schema public tem RLS ligado'
);

select is_empty(
  $$ select tablename, policyname from pg_catalog.pg_policies where schemaname = 'public' and cmd = 'ALL' $$,
  'nenhuma política usa FOR ALL: cada operação tem a sua'
);

select is_empty(
  $$ select c.relname
     from pg_catalog.pg_class as c
     join pg_catalog.pg_namespace as n on n.oid = c.relnamespace
     where n.nspname = 'public'
       and c.relkind = 'v'
       and not coalesce(c.reloptions @> array['security_invoker=true'], false) $$,
  'toda view do schema public usa security_invoker'
);

select is_empty(
  $$ select c.relname
     from pg_catalog.pg_class as c
     join pg_catalog.pg_namespace as n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind = 'm' $$,
  'nenhuma view materializada fica no schema public'
);

-- O RLS não cobre TRUNCATE: os papéis da API não podem ter essa permissão.
select is_empty(
  $$ select table_name, grantee, privilege_type
     from information_schema.role_table_grants
     where table_schema = 'public'
       and grantee in ('anon', 'authenticated')
       and privilege_type in ('TRUNCATE', 'REFERENCES', 'TRIGGER') $$,
  'os papéis da API não têm TRUNCATE, REFERENCES nem TRIGGER'
);

-- Função com as permissões do dono ignora o RLS. Cada nova precisa de um motivo forte: quem a
-- criar tem de acrescentá-la aqui de propósito.
select is(
  (select string_agg(p.proname::text, ', ' order by p.proname)
   from pg_catalog.pg_proc as p
   join pg_catalog.pg_namespace as n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.prosecdef),
  'complete_signup',
  'complete_signup é a única função do public com as permissões do dono'
);

select is_empty(
  $$ select p.proname
     from pg_catalog.pg_proc as p
     join pg_catalog.pg_namespace as n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.prosecdef
       and not coalesce(p.proconfig::text like '%search_path=%', false) $$,
  'toda função com as permissões do dono fixa o search_path'
);

-- Esta tabela existe só durante o teste: o rollback do fim a desfaz.
create table public.tabela_de_teste (id integer primary key);

select is_empty(
  $$ select grantee, privilege_type
     from information_schema.role_table_grants
     where table_name = 'tabela_de_teste'
       and grantee in ('anon', 'authenticated')
       and privilege_type in ('TRUNCATE', 'REFERENCES', 'TRIGGER') $$,
  'uma tabela nova já nasce sem essas permissões'
);

select * from finish();
rollback;
