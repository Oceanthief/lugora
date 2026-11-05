-- Uma linha por execução da importação (seção 10): a auditoria do pipeline.

create table public.overture_imports (
  id uuid primary key default gen_random_uuid(),
  release text not null,
  ran_at timestamptz not null default now(),
  added integer not null default 0,
  removed integer not null default 0,
  changed integer not null default 0,
  reconciled integer not null default 0,
  flagged integer not null default 0,
  merged integer not null default 0,
  in_review integer not null default 0,
  not_visitable integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger overture_imports_set_updated_at
  before update on public.overture_imports
  for each row execute function extensions.moddatetime(updated_at);

-- RLS ligado e nenhuma política: pela API, ninguém lê nem escreve. Só o pipeline usa esta tabela.
alter table public.overture_imports enable row level security;
revoke all on table public.overture_imports from anon, authenticated;
