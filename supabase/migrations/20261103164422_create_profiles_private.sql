-- Dados que só o dono vê. O RLS protege linhas, não colunas: se home_city_id ficasse
-- em profiles, quem pode ver o perfil veria a cidade. Por isso a tabela é separada.

create table public.profiles_private (
  user_id uuid primary key references auth.users (id) on delete cascade,
  home_city_id uuid not null references public.cities (id),
  age_confirmed_at timestamptz not null,
  show_home_city boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_private_home_city_id_idx on public.profiles_private (home_city_id);

create trigger profiles_private_set_updated_at
  before update on public.profiles_private
  for each row execute function extensions.moddatetime(updated_at);

alter table public.profiles_private enable row level security;

create policy profiles_private_select_own on public.profiles_private
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy profiles_private_insert_own on public.profiles_private
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy profiles_private_update_own on public.profiles_private
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Sem política de delete: a linha só some junto com a conta (Fatia 8).

-- Quem não está logado não toca na tabela, nem por engano numa política futura.
revoke all on table public.profiles_private from anon;

-- O dono só muda estas colunas. A data da confirmação de 18+ não se altera depois.
revoke update on table public.profiles_private from authenticated;
grant update (home_city_id, show_home_city) on table public.profiles_private to authenticated;
