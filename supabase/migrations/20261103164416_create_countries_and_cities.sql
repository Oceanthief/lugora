-- Países e cidades: tabelas de referência, preenchidas pelo pipeline do Overture
-- (pipelines/overture/). Ninguém escreve nelas pela API.

-- As extensões ficam no schema "extensions" para que as tabelas internas do PostGIS
-- (como spatial_ref_sys, que não tem RLS) não entrem no "public".
create extension if not exists postgis with schema extensions;
create extension if not exists moddatetime with schema extensions;

create table public.countries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  iso_code text not null unique check (iso_code ~ '^[A-Z]{2}$'),
  boundary extensions.geography(MultiPolygon, 4326) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index countries_boundary_idx on public.countries using gist (boundary);

create trigger countries_set_updated_at
  before update on public.countries
  for each row execute function extensions.moddatetime(updated_at);

create table public.cities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  state text,
  country_id uuid not null references public.countries (id),
  boundary extensions.geography(MultiPolygon, 4326) not null,
  source text not null default 'overture',
  gers_id text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index cities_boundary_idx on public.cities using gist (boundary);
create index cities_country_id_idx on public.cities (country_id);

create trigger cities_set_updated_at
  before update on public.cities
  for each row execute function extensions.moddatetime(updated_at);

alter table public.countries enable row level security;
alter table public.cities enable row level security;

-- Dado público de referência: qualquer pessoa lê. Sem política de escrita, ninguém
-- altera pela API; só o pipeline, que roda na máquina local.
create policy countries_select_all on public.countries
  for select to anon, authenticated
  using (true);

create policy cities_select_all on public.cities
  for select to anon, authenticated
  using (true);
