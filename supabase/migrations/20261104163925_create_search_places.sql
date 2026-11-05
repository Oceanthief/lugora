-- Busca de lugares (D1): por semelhança com o texto, depois por distância e confiança.
-- As visitas no Lugora entram na ordenação na Fatia 4, quando existirem.

create extension if not exists pg_trgm with schema extensions;

-- Os limites ficam aqui para poderem mudar sem alterar a função.
insert into public.app_parameters (key, value, description) values
  (
    'place_search_strong_similarity',
    '0.9',
    'Busca de lugares: a partir desta semelhança, o nome contém a palavra digitada. Se algum lugar chega aqui, só esses aparecem.'
  ),
  (
    'place_search_fuzzy_similarity',
    '0.5',
    'Busca de lugares: semelhança mínima quando nenhum nome contém a palavra digitada, para tolerar erro de digitação.'
  );

-- A busca roda com as permissões de quem chama e usa a normalização do schema private. Isto deixa
-- chamar funções dali, mas não dá acesso a nenhuma tabela, e a API não expõe esse schema.
grant usage on schema private to authenticated;

create function public.search_places(
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
      private.normalize_search_text(p_query) as term,
      -- A posição só serve para este cálculo: a função não grava nada.
      case
        when p_latitude between -90 and 90 and p_longitude between -180 and 180
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

-- Só quem está logado busca. Por padrão, o Postgres deixa qualquer um executar.
revoke execute on function public.search_places(text, double precision, double precision) from public, anon;
grant execute on function public.search_places(text, double precision, double precision) to authenticated;
