-- Achados da revisão de privacidade da Fatia 3:
-- 1. A distância só existe para quem deu o consentimento, mesmo para quem chama a função direto (seção 9.1).
-- 2. Um texto enorme prendia uma conexão do banco por vários segundos (seção 9.4).
-- Nenhuma política de RLS muda. As permissões das duas funções continuam as mesmas.

insert into public.app_parameters (key, value, description) values (
  'search_max_length',
  '150',
  'Buscas de lugares e de cidades: só estes primeiros caracteres contam. O maior nome da base tem 141.'
);

create or replace function public.search_places(
  p_query text,
  p_latitude double precision default null,
  p_longitude double precision default null
)
returns table (
  id uuid,
  name text,
  address text,
  category text,
  is_visitable boolean,
  distance_meters double precision
)
language sql
stable
security invoker
set search_path = ''
as $$
  with search as (
    select
      private.normalize_search_text(
        left(p_query, (select (value #>> '{}')::int from public.app_parameters where key = 'search_max_length'))
      ) as term,
      -- Só com o consentimento de quem busca, e vale a resposta mais recente (seção 9.1).
      -- A posição serve só para este cálculo: a função não grava nada.
      case
        when p_latitude between -90 and 90
          and p_longitude between -180 and 180
          and coalesce((
            select consent.granted
            from public.consents as consent
            where consent.user_id = (select auth.uid())
              and consent.purpose = 'precise_location'
            order by consent.created_at desc
            limit 1
          ), false)
          then extensions.ST_SetSRID(extensions.ST_MakePoint(p_longitude, p_latitude), 4326)::extensions.geography
      end as origin,
      (select (value #>> '{}')::real from public.app_parameters where key = 'place_search_strong_similarity') as strong,
      (select (value #>> '{}')::real from public.app_parameters where key = 'place_search_fuzzy_similarity') as fuzzy
  ),
  -- Primeiro só a nota de cada lugar: os demais campos, e a distância, vêm só de quem passar.
  scored as (
    select place.id, extensions.word_similarity(search.term, place.search_name) as similarity
    from public.places as place
    cross join search
    where place.status = 'active'
      and char_length(search.term) >= 2
  ),
  best as (
    select max(scored.similarity) as similarity from scored
  ),
  -- Se algum nome contém a palavra digitada, só esses aparecem. Sem isso, "poleiro" traria
  -- "Casa do Oleiro". Se nenhum contém, a busca tolera erro de digitação: "poleito" acha o Poleiro.
  matches as (
    select
      place.id,
      place.name,
      place.address,
      coalesce(place.category_override, place.category) as category,
      place.is_visitable,
      place.confidence,
      place.search_name,
      scored.similarity,
      extensions.ST_Distance(place.location, search.origin)::double precision as distance_meters
    from scored
    cross join search
    cross join best
    join public.places as place on place.id = scored.id
    where scored.similarity >= case when best.similarity >= search.strong then search.strong else search.fuzzy end
  )
  select
    matches.id,
    matches.name,
    matches.address,
    matches.category,
    matches.is_visitable,
    matches.distance_meters
  from matches
  cross join search
  order by
    case when matches.search_name = search.term then 2 else round(matches.similarity::numeric, 1) end desc,
    matches.is_visitable desc,
    matches.distance_meters asc nulls last,
    matches.confidence desc nulls last,
    matches.name,
    matches.id
  limit 10;
$$;

create or replace function public.search_cities(p_query text)
returns table (id uuid, name text, state text)
language sql
stable
security invoker
set search_path = ''
as $$
  with search as (
    -- Sem acentos, em minúsculas e com a pontuação virando espaço. Assim, "%" e "_" digitados
    -- não funcionam como curinga, e "embu guacu" acha "Embu-Guaçu".
    select btrim(regexp_replace(
      lower(extensions.unaccent(
        left(p_query, (select (value #>> '{}')::int from public.app_parameters where key = 'search_max_length'))
      )),
      '[^a-z0-9]+', ' ', 'g'
    )) as term
  ),
  candidates as (
    select
      city.id,
      city.name,
      city.state,
      btrim(regexp_replace(lower(extensions.unaccent(city.name)), '[^a-z0-9]+', ' ', 'g')) as normalized
    from public.cities as city
  )
  select candidates.id, candidates.name, candidates.state
  from candidates
  cross join search
  where char_length(search.term) >= 2
    and strpos(candidates.normalized, search.term) > 0
  order by
    candidates.normalized = search.term desc,      -- primeiro, o nome exato
    starts_with(candidates.normalized, search.term) desc,  -- depois, quem começa com o termo
    candidates.normalized,
    candidates.state
  limit 10;
$$;
