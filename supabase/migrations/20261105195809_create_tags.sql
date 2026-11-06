-- Etiquetas (seção 7.8): a lista fixa de ocasiões, temas e atributos. Aqui fica só o código;
-- o texto que aparece na tela fica em web/src/content/pt-BR.ts.

create table public.tags (
  id text primary key check (id ~ '^[a-z_]{2,40}$'),
  kind text not null check (kind in ('occasion', 'theme', 'attribute')),
  -- Desativar tira a etiqueta da tela, mas ela continua nas visitas antigas.
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger tags_set_updated_at
  before update on public.tags
  for each row execute function extensions.moddatetime(updated_at);

alter table public.tags enable row level security;

-- Quem está logado lê a lista. Sem política de escrita: só uma nova migração muda a lista.
create policy tags_select_authenticated on public.tags
  for select to authenticated
  using (true);

revoke all on table public.tags from anon, authenticated;
grant select (id, kind, is_active) on table public.tags to authenticated;

insert into public.tags (id, kind) values
  ('romantic', 'occasion'),
  ('with_friends', 'occasion'),
  ('with_family', 'occasion'),
  ('solo', 'occasion'),
  ('work_study', 'occasion'),
  ('geek', 'theme'),
  ('sports', 'theme'),
  ('culture', 'theme'),
  ('outdoors', 'theme'),
  ('nightlife', 'theme'),
  ('cheap', 'attribute'),
  ('pet_friendly', 'attribute');
