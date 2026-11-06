-- Seguir (seção 8), só o mínimo para a visibilidade "seguidores" valer de verdade desde já
-- (teste 3 da seção 9.5). Seguir, aceitar e deixar de seguir pelo app entram na Fatia 9. Até lá,
-- nenhuma escrita pela API: sem as regras de aprovação, qualquer pessoa viraria seguidora de
-- qualquer outra e passaria a ver as visitas "seguidores".

create table public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  followee_id uuid not null references public.profiles (id) on delete cascade,
  -- "pending" é o pedido ainda não aceito: não dá acesso a nada.
  status text not null default 'active' check (status in ('active', 'pending')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  constraint follows_not_self check (follower_id <> followee_id)
);

create index follows_followee_id_idx on public.follows (followee_id);

create trigger follows_set_updated_at
  before update on public.follows
  for each row execute function extensions.moddatetime(updated_at);

alter table public.follows enable row level security;

-- Cada pessoa vê só as relações de que faz parte: quem ela segue e quem a segue. Se as listas de
-- seguidores serão públicas, é decisão da Fatia 9.
create policy follows_select_own on public.follows
  for select to authenticated
  using (follower_id = (select auth.uid()) or followee_id = (select auth.uid()));

-- Sem política de insert, update e delete nesta fatia.

revoke all on table public.follows from anon, authenticated;
grant select (follower_id, followee_id, status) on table public.follows to authenticated;
