-- Perfil: só o que outras pessoas podem ver. O e-mail fica no auth.users, sem cópia aqui.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  username text not null unique check (username ~ '^[a-z0-9_]{3,30}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function extensions.moddatetime(updated_at);

alter table public.profiles enable row level security;

-- Quem está logado vê nome e @ de qualquer pessoa.
create policy profiles_select_authenticated on public.profiles
  for select to authenticated
  using (true);

-- Só existe perfil depois da confirmação de 18+ e do aceite da política, mesmo que
-- alguém chame a API direto, sem passar pela tela de cadastro.
create policy profiles_insert_own on public.profiles
  for insert to authenticated
  with check (
    id = (select auth.uid())
    and exists (
      select 1 from public.profiles_private as private
      where private.user_id = (select auth.uid())
    )
    and exists (
      select 1 from public.consents as consent
      where consent.user_id = (select auth.uid())
        and consent.purpose = 'essential'
        and consent.granted
    )
  );

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Sem política de delete: o perfil só some junto com a conta (Fatia 8).

revoke all on table public.profiles from anon;

revoke update on table public.profiles from authenticated;
grant update (name, username) on table public.profiles to authenticated;
