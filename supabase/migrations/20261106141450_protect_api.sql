-- Proteção da API (seção 9.4), antes de o banco ir para a nuvem.

-- 1. Polígonos fora da API (achado da revisão da Fatia 2). Qualquer pessoa, mesmo sem login,
-- conseguia baixar os limites de 5.571 cidades e 219 países (cerca de 285 MB), sem limite. O app só
-- usa o nome e a UF; o mapa da Fatia 6 vai ler os polígonos por uma função, simplificados.
-- Os nomes continuam públicos: são dados abertos do IBGE e do Overture.
-- As permissões de escrita que sobravam também saem: o RLS já as barrava, sem política de escrita.
revoke all on table public.countries, public.cities from anon, authenticated;
grant select (id, name, iso_code, created_at, updated_at) on table public.countries to anon, authenticated;
grant select (id, name, state, country_id, source, gers_id, created_at, updated_at) on table public.cities to anon, authenticated;

-- 2. Limite de escritas por pessoa. O app fala com o banco a partir do servidor (Vercel), então o
-- IP que chega aqui é o do servidor, igual para todo mundo: um limite por IP pararia todos juntos.
-- O limite é por pessoa logada, e vale também para quem chama a API direto com o próprio token.
-- Leituras não contam: rodam em transação só de leitura, onde não dá para gravar a contagem.
insert into public.app_parameters (key, value, description) values
  (
    'api_write_limit',
    '60',
    'API: quantas escritas (registrar, publicar, encerrar viagem etc.) cada pessoa pode fazer na janela de api_write_window.'
  ),
  (
    'api_write_window',
    '"5 minutes"',
    'API: a janela do limite de escritas por pessoa (seção 9.4).'
  );

-- Fica no schema private: a API não lê nem escreve aqui.
create table private.api_writes (
  user_id uuid not null,
  requested_at timestamptz not null default now()
);

create index api_writes_user_id_requested_at_idx on private.api_writes (user_id, requested_at);

-- A API (PostgREST) chama esta função antes de cada pedido. Roda com as permissões do dono porque
-- grava na tabela acima, que a API não acessa. É segura porque só conta e recusa: não recebe
-- parâmetro, só usa auth.uid() e não devolve dado nenhum. Visitante (sem login) não escreve nada,
-- então não conta. Está no public porque a API a chama também nos pedidos de visitante, e o
-- visitante não enxerga o schema private. O teste 00_guardrails lista as funções assim.
create function public.limit_api_writes()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_window interval;
  v_limit integer;
  v_recent integer;
begin
  if v_user_id is null or current_setting('transaction_read_only') = 'on' then
    return;
  end if;

  select (parameter.value #>> '{}')::interval into v_window
  from public.app_parameters as parameter where parameter.key = 'api_write_window';
  select (parameter.value #>> '{}')::integer into v_limit
  from public.app_parameters as parameter where parameter.key = 'api_write_limit';

  -- O que passou da janela não serve mais: a tabela fica pequena.
  delete from private.api_writes
  where user_id = v_user_id and requested_at < now() - v_window;

  select count(*) into v_recent
  from private.api_writes
  where user_id = v_user_id;

  if v_recent >= v_limit then
    -- O PostgREST transforma isto numa resposta 429 ("muitos pedidos").
    raise sqlstate 'PGRST' using
      message = json_build_object('code', 'too_many_writes', 'message', 'too_many_writes')::text,
      detail = json_build_object('status', 429, 'headers', json_build_object('Retry-After', '60'))::text;
  end if;

  insert into private.api_writes (user_id) values (v_user_id);
end;
$$;

revoke execute on function public.limit_api_writes() from public;
grant execute on function public.limit_api_writes() to anon, authenticated;

alter role authenticator set pgrst.db_pre_request = 'public.limit_api_writes';
notify pgrst, 'reload config';
