-- Viagem (seções 7.5 e 8), só o básico: as visitas fora da cidade de residência se juntam numa
-- viagem, e ela segura a publicação até encerrar. Título, datas e participantes ficam para depois.

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  -- Quando a viagem encerra sozinha, se não chegar outra visita fora de casa antes. Cada visita
  -- nova empurra este momento para frente; "Encerrar viagem" o traz para agora. A viagem está
  -- aberta enquanto closes_at está no futuro.
  closes_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Deixa a visita apontar para o par (viagem, dona): nunca para a viagem de outra pessoa.
  unique (id, user_id)
);

create index trips_user_id_closes_at_idx on public.trips (user_id, closes_at);

create trigger trips_set_updated_at
  before update on public.trips
  for each row execute function extensions.moddatetime(updated_at);

alter table public.trips enable row level security;

-- Uma viagem aberta diz que a pessoa está fora de casa: só a dona vê.
create policy trips_select_own on public.trips
  for select to authenticated
  using (user_id = (select auth.uid()));

-- A dona pode encerrar a viagem. O gatilho abaixo impede adiar.
create policy trips_update_own on public.trips
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Sem insert nem delete pela API: o próprio banco abre a viagem ao registrar a visita.

revoke all on table public.trips from anon, authenticated;
grant select (id, user_id, closes_at) on table public.trips to authenticated;
grant update (closes_at) on table public.trips to authenticated;

-- Pela API, a viagem só pode ser encerrada agora, nunca adiada. Um encerramento no passado vira
-- "agora", e uma viagem já encerrada continua como estava. Só o banco, ao registrar uma visita
-- nova fora de casa, adia: aí a função roda como o dono dela (postgres), não como authenticated.
create function private.trips_only_close_early()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user = 'authenticated' and new.closes_at is distinct from old.closes_at then
    if new.closes_at > now() then
      raise exception 'trip_cannot_be_extended';
    end if;
    new.closes_at := least(old.closes_at, now());
  end if;
  return new;
end;
$$;

create trigger trips_only_close_early
  before update on public.trips
  for each row execute function private.trips_only_close_early();

-- O botão "Encerrar viagem".
create function public.close_trip(p_trip_id uuid)
returns void
language sql
security invoker
set search_path = ''
as $$
  update public.trips
  set closes_at = now()
  where id = p_trip_id
    and user_id = (select auth.uid());
$$;

revoke execute on function public.close_trip(uuid) from public, anon;
grant execute on function public.close_trip(uuid) to authenticated;
