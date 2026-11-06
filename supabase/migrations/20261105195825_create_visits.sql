-- Visitas (seções 7.1 e 7.5): o coração do produto.

-- 1. Parâmetros da publicação e das etiquetas.
insert into public.app_parameters (key, value, description) values
  (
    'publish_delay_home',
    '"24 hours"',
    'Minha cidade: tempo entre o registro e a publicação da visita (seção 7.5).'
  ),
  (
    'trip_auto_close_after',
    '"3 days"',
    'Viagem: tempo sem registros fora da cidade de residência para ela encerrar e as visitas aparecerem (seção 7.5).'
  ),
  (
    'visit_max_tags',
    '3',
    'Etiquetas (ocasiões, temas e atributos) por visita (seção 7.8).'
  );

-- 2. "O padrão vem do perfil" (seção 7.5). Pública, com o atraso de publicação protegendo a
-- pessoa. A tela para mudar o padrão entra na Fatia 8. Só a dona lê esta tabela.
alter table public.profiles_private
  add column default_visibility text not null default 'public'
    check (default_visibility in ('public', 'followers', 'private'));

-- 3. A tabela.
create table public.visits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  place_id uuid not null references public.places (id),
  visited_on date not null check (visited_on >= date '1900-01-01'),
  rating numeric(2, 1) not null check (rating between 0.5 and 5 and rating * 2 = trunc(rating * 2)),
  -- Daqui até publish_at, o banco calcula no registro; a pessoa não escolhe.
  is_resident boolean not null,
  trip_id uuid,
  -- A pessoa pode escolher; se não escolher, vem o padrão (seção 7.5).
  visibility text not null check (visibility in ('public', 'followers', 'private')),
  publish_at timestamptz not null,
  -- Só a data, no horário de Brasília: a hora da publicação revelaria a hora do registro.
  publish_on date generated always as ((timezone('America/Sao_Paulo', publish_at))::date) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Visita fora de casa fica numa viagem da própria dona; visita em casa não tem viagem.
  foreign key (trip_id, user_id) references public.trips (id, user_id),
  constraint visits_trip_only_away check (is_resident = (trip_id is null))
);

create index visits_user_id_idx on public.visits (user_id);
create index visits_place_id_idx on public.visits (place_id);
create index visits_trip_id_idx on public.visits (trip_id) where trip_id is not null;

create trigger visits_set_updated_at
  before update on public.visits
  for each row execute function extensions.moddatetime(updated_at);

-- 4. O que o banco calcula no registro: se a pessoa mora na cidade do lugar, a viagem, a
-- visibilidade padrão e quando a visita aparece para os outros. O que vier da API nesses campos
-- é substituído.
--
-- Roda com as permissões do dono da função porque mexe na viagem e nas outras visitas da pessoa,
-- colunas que a API não pode ler nem mudar. É seguro porque: recusa visita para outra pessoa;
-- função de gatilho não pode ser chamada direto; e o schema private não é exposto pela API.
-- O teste 00_guardrails lista as funções assim.
create function private.prepare_visit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_home_city_id uuid;
  v_default_visibility text;
  v_place_city_id uuid;
  v_place_category text;
  v_place_is_sensitive boolean;
  v_trip_id uuid;
  v_closes_at timestamptz;
begin
  -- Pela API, só para si mesma. Sem sessão (seed e testes, como postgres), vale o user_id dado.
  if (select auth.uid()) is not null and new.user_id is distinct from (select auth.uid()) then
    raise exception 'not_your_visit';
  end if;

  -- O banco não sabe o fuso de quem registra: aceita até o "hoje" do fuso mais adiantado do
  -- mundo (UTC+14). A tela usa a data do aparelho.
  if new.visited_on > (timezone('Pacific/Kiritimati', now()))::date then
    raise exception 'visited_on_in_future';
  end if;

  -- "for update" trava o perfil até o fim do registro: duas visitas fora de casa ao mesmo tempo
  -- não abrem duas viagens.
  select profile.home_city_id, profile.default_visibility
  into v_home_city_id, v_default_visibility
  from public.profiles_private as profile
  where profile.user_id = new.user_id
  for update;

  if not found then
    raise exception 'signup_required';
  end if;

  -- Os mesmos lugares que a pessoa enxerga: ativos e fechados (D2).
  select place.city_id, coalesce(place.category_override, place.category), place.is_sensitive
  into v_place_city_id, v_place_category, v_place_is_sensitive
  from public.places as place
  where place.id = new.place_id
    and place.status in ('active', 'closed');

  if not found then
    raise exception 'place_not_found';
  end if;

  -- Condomínio aparece na busca pelo nome, mas não é lugar para visitar (D3).
  if v_place_category = 'residential' then
    raise exception 'place_not_visitable';
  end if;

  new.is_resident := v_place_city_id = v_home_city_id;

  -- Lugar sensível nasce "só eu" (D5); a pessoa pode escolher outra visibilidade de propósito.
  new.visibility := coalesce(
    new.visibility,
    case when v_place_is_sensitive then 'private' else v_default_visibility end
  );

  if new.is_resident then
    new.trip_id := null;
    new.publish_at := now() + (
      select (parameter.value #>> '{}')::interval
      from public.app_parameters as parameter
      where parameter.key = 'publish_delay_home'
    );
  else
    v_closes_at := now() + (
      select (parameter.value #>> '{}')::interval
      from public.app_parameters as parameter
      where parameter.key = 'trip_auto_close_after'
    );

    -- Continua a viagem aberta; se não houver, começa outra.
    select trip.id into v_trip_id
    from public.trips as trip
    where trip.user_id = new.user_id
      and trip.closes_at > now()
    order by trip.closes_at desc
    limit 1;

    if v_trip_id is null then
      insert into public.trips (user_id, closes_at)
      values (new.user_id, v_closes_at)
      returning id into v_trip_id;
    else
      -- Adia o encerramento. O gatilho sync_trip_visits leva junto as visitas da viagem que
      -- ainda não apareceram.
      update public.trips
      set closes_at = v_closes_at
      where id = v_trip_id;
    end if;

    new.trip_id := v_trip_id;
    new.publish_at := v_closes_at;
  end if;

  new.created_at := now();
  return new;
end;
$$;

create trigger visits_prepare
  before insert on public.visits
  for each row execute function private.prepare_visit();

-- 5. Pela API, a dona só pode trazer a publicação para agora ("publicar agora", seção 7.5):
-- nunca adiar, nem pôr no passado, o que mudaria a ordem do feed. Uma visita já publicada
-- continua como estava. Só o banco adia, ao seguir a viagem.
create function private.visits_only_publish_early()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user = 'authenticated' and new.publish_at is distinct from old.publish_at then
    if new.publish_at > now() then
      raise exception 'publish_at_cannot_be_delayed';
    end if;
    new.publish_at := least(old.publish_at, now());
  end if;
  return new;
end;
$$;

create trigger visits_only_publish_early
  before update on public.visits
  for each row execute function private.visits_only_publish_early();

-- 6. As visitas da viagem que ainda não apareceram aparecem quando a viagem encerra: adiam
-- junto quando chega uma visita nova fora de casa, e vêm para agora em "Encerrar viagem".
-- Roda com as permissões do dono pelo mesmo motivo de prepare_visit: a API não lê trip_id.
create function private.sync_trip_visits()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.visits
  set publish_at = new.closes_at
  where trip_id = new.id
    and user_id = new.user_id
    and publish_at > now();
  return null;
end;
$$;

create trigger trips_sync_visits
  after update of closes_at on public.trips
  for each row
  when (new.closes_at is distinct from old.closes_at)
  execute function private.sync_trip_visits();

-- Funções de gatilho não podem ser chamadas direto, mas fica explícito: ninguém executa.
revoke execute on function private.prepare_visit() from public;
revoke execute on function private.sync_trip_visits() from public;

-- 7. Quem vê cada visita.
alter table public.visits enable row level security;

-- A dona vê sempre. Outra pessoa vê só se: concluiu o cadastro (18+), a visita já foi publicada
-- e ela é pública, ou é "seguidores" e essa pessoa segue a dona com o pedido aceito.
-- Visita "só eu" nunca aparece para outra pessoa.
create policy visits_select_visible on public.visits
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or (
      publish_at <= now()
      and (
        visibility = 'public'
        or (
          visibility = 'followers'
          and exists (
            select 1
            from public.follows as follow
            where follow.follower_id = (select auth.uid())
              and follow.followee_id = visits.user_id
              and follow.status = 'active'
          )
        )
      )
      and (select exists (
        select 1 from public.profiles_private as private
        where private.user_id = (select auth.uid())
      ))
    )
  );

create policy visits_insert_own on public.visits
  for insert to authenticated
  with check (user_id = (select auth.uid()));

-- Só para "publicar agora": publish_at é a única coluna que a API pode mudar.
create policy visits_update_own on public.visits
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Sem política de delete nesta fatia.

-- O RLS escolhe as linhas; as permissões abaixo escolhem as colunas. Ninguém lê pela API:
-- publish_at, created_at e updated_at, que revelam a hora; is_resident e trip_id, que revelam
-- onde a pessoa mora. Nem a dona: a permissão vale para o papel, não para a linha.
revoke all on table public.visits from anon, authenticated;
grant select (id, user_id, place_id, visited_on, rating, visibility, publish_on)
  on table public.visits to authenticated;
grant insert (place_id, visited_on, rating, visibility) on table public.visits to authenticated;
grant update (publish_at) on table public.visits to authenticated;

-- 8. Etiquetas de cada visita.
create table public.visit_tags (
  visit_id uuid not null references public.visits (id) on delete cascade,
  tag_id text not null references public.tags (id),
  primary key (visit_id, tag_id)
);

create index visit_tags_tag_id_idx on public.visit_tags (tag_id);

alter table public.visit_tags enable row level security;

-- Quem vê a visita vê as etiquetas dela: a consulta abaixo passa pelas regras de visits.
create policy visit_tags_select_visible on public.visit_tags
  for select to authenticated
  using (exists (select 1 from public.visits as visit where visit.id = visit_tags.visit_id));

-- Só a dona etiqueta a própria visita, e só com etiquetas ativas.
create policy visit_tags_insert_own on public.visit_tags
  for insert to authenticated
  with check (
    exists (
      select 1 from public.visits as visit
      where visit.id = visit_id
        and visit.user_id = (select auth.uid())
    )
    and exists (
      select 1 from public.tags as tag
      where tag.id = tag_id
        and tag.is_active
    )
  );

-- Sem política de update e delete nesta fatia.

revoke all on table public.visit_tags from anon, authenticated;
grant select (visit_id, tag_id) on table public.visit_tags to authenticated;
grant insert (visit_id, tag_id) on table public.visit_tags to authenticated;

-- No máximo visit_max_tags por visita. Trava a visita enquanto conta, para dois pedidos ao mesmo
-- tempo não passarem do limite.
create function private.limit_visit_tags()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  perform 1 from public.visits as visit where visit.id = new.visit_id for update;

  if (select count(*) from public.visit_tags as visit_tag where visit_tag.visit_id = new.visit_id)
    >= (
      select (parameter.value #>> '{}')::int
      from public.app_parameters as parameter
      where parameter.key = 'visit_max_tags'
    )
  then
    raise exception 'too_many_tags';
  end if;
  return new;
end;
$$;

create trigger visit_tags_limit
  before insert on public.visit_tags
  for each row execute function private.limit_visit_tags();

-- 9. O registro rápido numa chamada só: a visita e as etiquetas entram juntas, ou nenhuma entra.
-- Roda com as permissões de quem chama, então todas as regras acima valem.
create function public.create_visit(
  p_place_id uuid,
  p_visited_on date,
  p_rating numeric,
  p_tag_ids text[] default '{}',
  p_visibility text default null
)
returns table (id uuid, visibility text, publish_on date)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_visit_id uuid;
begin
  insert into public.visits as visit (place_id, visited_on, rating, visibility)
  values (p_place_id, p_visited_on, p_rating, p_visibility)
  returning visit.id into v_visit_id;

  insert into public.visit_tags (visit_id, tag_id)
  select v_visit_id, chosen.tag_id
  from (select distinct unnest(coalesce(p_tag_ids, '{}')) as tag_id) as chosen;

  return query
    select visit.id, visit.visibility, visit.publish_on
    from public.visits as visit
    where visit.id = v_visit_id;
end;
$$;

revoke execute on function public.create_visit(uuid, date, numeric, text[], text) from public, anon;
grant execute on function public.create_visit(uuid, date, numeric, text[], text) to authenticated;

-- O botão "Publicar agora". Devolve a nova data de publicação.
create function public.publish_visit_now(p_visit_id uuid)
returns date
language sql
security invoker
set search_path = ''
as $$
  update public.visits as visit
  set publish_at = now()
  where visit.id = p_visit_id
    and visit.user_id = (select auth.uid())
  returning visit.publish_on;
$$;

revoke execute on function public.publish_visit_now(uuid) from public, anon;
grant execute on function public.publish_visit_now(uuid) to authenticated;
