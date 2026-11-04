-- Limiares e configurações do produto, para não deixar números fixos no código.

create table public.app_parameters (
  key text primary key,
  value jsonb not null,
  description text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger app_parameters_set_updated_at
  before update on public.app_parameters
  for each row execute function extensions.moddatetime(updated_at);

alter table public.app_parameters enable row level security;

-- Não guarda segredos: qualquer pessoa lê. Sem política de escrita, só uma nova
-- migração muda os valores.
create policy app_parameters_select_all on public.app_parameters
  for select to anon, authenticated
  using (true);

insert into public.app_parameters (key, value, description) values
  (
    'privacy_policy_version',
    '"2026-11-rascunho"',
    'Versão da política de privacidade registrada em cada consentimento (seção 9.1).'
  );
