-- Lugares: a base do Overture, com as correções de D1 a D5. Sem e-mails nem telefones.

-- Sem acentos, em minúsculas e com a pontuação virando espaço. A busca e a deduplicação comparam
-- os nomes assim. "immutable" é o que permite usar a função numa coluna gerada.
create function private.normalize_search_text(p_text text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select btrim(regexp_replace(
    lower(extensions.unaccent('extensions.unaccent'::regdictionary, p_text)),
    '[^a-z0-9]+', ' ', 'g'
  ));
$$;

create table public.places (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  search_name text generated always as (private.normalize_search_text(name)) stored,
  location extensions.geography(Point, 4326) not null,
  address text,
  postal_code text,
  city_id uuid not null references public.cities (id),
  overture_category text,
  -- A categoria que vale é coalesce(category_override, category). A correção pelo usuário (D3)
  -- tem prioridade, e a importação nunca a sobrescreve.
  category text,
  category_override text,
  -- Sem categoria também conta como visitável: 677 lugares de JF, como o Santiago Lanches e o
  -- Restaurante Universitário da UFJF. O primeiro usuário a registrar a visita escolhe a categoria.
  is_visitable boolean not null,
  is_sensitive boolean not null default false,
  origin text not null default 'overture' check (origin in ('overture', 'user')),
  status text not null default 'active' check (status in ('active', 'pending', 'closed', 'merged')),
  merged_into_id uuid references public.places (id),
  confidence double precision check (confidence between 0 and 1),
  sources text[] not null default '{}',
  gers_id text unique,
  merged_gers_ids text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index places_location_idx on public.places using gist (location);
create index places_city_id_idx on public.places (city_id);

create trigger places_set_updated_at
  before update on public.places
  for each row execute function extensions.moddatetime(updated_at);

alter table public.places enable row level security;

-- Quem está logado vê os lugares ativos e os fechados, que continuam no histórico de quem visitou
-- (D2). Lugares pendentes e mesclados ficam de fora: as regras deles entram na Fatia 5.
create policy places_select_authenticated on public.places
  for select to authenticated
  using (status in ('active', 'closed'));

-- Sem visitante e sem escrita pela API: só o pipeline, que roda na máquina local, carrega a base.
-- Criar lugar pelo app entra na Fatia 5, com as regras da D6.
revoke all on table public.places from anon, authenticated;
grant select on table public.places to authenticated;
