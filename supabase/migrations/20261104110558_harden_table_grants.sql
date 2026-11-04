-- O RLS filtra select, insert, update e delete, mas não vale para TRUNCATE (que apaga a
-- tabela inteira). O Supabase dá essa permissão por padrão aos papéis da API, que não
-- precisam dela nem de REFERENCES e TRIGGER. Menos permissão, menos risco.

revoke truncate, references, trigger
  on table
    public.countries,
    public.cities,
    public.app_parameters,
    public.profiles_private,
    public.consents,
    public.profiles
  from anon, authenticated;

-- Vale também para as tabelas que as próximas fatias criarem.
alter default privileges for role postgres in schema public
  revoke truncate, references, trigger on tables from anon, authenticated;
