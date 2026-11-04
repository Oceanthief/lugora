-- Consentimentos por finalidade (seção 9.1): um registro por finalidade e versão da
-- política. "essential" é o aceite da política; os outros são opcionais e podem ser
-- retirados a qualquer momento (granted = false).

create table public.consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  purpose text not null check (purpose in ('essential', 'precise_location', 'emails', 'analytics')),
  policy_version text not null,
  granted boolean not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, purpose, policy_version),
  -- Quem não aceita o essencial não usa o app; deixar de aceitar é excluir a conta.
  constraint consents_essential_must_be_granted check (purpose <> 'essential' or granted)
);

create trigger consents_set_updated_at
  before update on public.consents
  for each row execute function extensions.moddatetime(updated_at);

alter table public.consents enable row level security;

create policy consents_select_own on public.consents
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy consents_insert_own on public.consents
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy consents_update_own on public.consents
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Sem política de delete: o registro é a prova do aceite e só some com a conta (Fatia 8).

revoke all on table public.consents from anon;

-- A única mudança possível é dar ou retirar o consentimento.
revoke update on table public.consents from authenticated;
grant update (granted) on table public.consents to authenticated;
