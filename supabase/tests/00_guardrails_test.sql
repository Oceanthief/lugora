-- Regras que valem para o banco inteiro, inclusive para tabelas das próximas fatias.
begin;
select plan(10);

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
  'complete_signup, limit_api_writes, my_visited_places',
  'no public, só o cadastro, o limite de escritas e o mapa da própria pessoa têm as permissões do dono'
);

-- No schema private, que a API não expõe, ficam só funções de gatilho, que ninguém chama direto.
-- Elas mexem na viagem e nas visitas da própria pessoa, colunas que a API não lê (Fatia 4).
select is(
  (select string_agg(p.proname::text, ', ' order by p.proname)
   from pg_catalog.pg_proc as p
   join pg_catalog.pg_namespace as n on n.oid = p.pronamespace
   where n.nspname = 'private' and p.prosecdef),
  'prepare_visit, sync_trip_visits',
  'no schema private, só os gatilhos de visita e de viagem têm as permissões do dono'
);

select is_empty(
  $$ select p.proname
     from pg_catalog.pg_proc as p
     join pg_catalog.pg_namespace as n on n.oid = p.pronamespace
     where n.nspname = 'private'
       and p.prosecdef
       and p.prorettype <> 'pg_catalog.trigger'::pg_catalog.regtype $$,
  'toda função do private com as permissões do dono é de gatilho'
);

select is_empty(
  $$ select p.proname
     from pg_catalog.pg_proc as p
     join pg_catalog.pg_namespace as n on n.oid = p.pronamespace
     where n.nspname in ('public', 'private')
       and p.prosecdef
       and not coalesce('search_path=""' = any (p.proconfig), false) $$,
  'toda função com as permissões do dono usa search_path vazio'
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
