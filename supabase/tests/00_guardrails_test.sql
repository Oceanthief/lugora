-- Regras que valem para o banco inteiro, inclusive para tabelas das próximas fatias.
begin;
select plan(4);

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

select * from finish();
rollback;
