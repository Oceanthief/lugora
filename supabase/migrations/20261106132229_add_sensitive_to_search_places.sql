-- A busca passa a dizer se o lugar é sensível (D5). Assim, a tela de registro já mostra "só eu"
-- e o aviso antes de salvar. Quem decide continua sendo o banco, no registro.
-- Mudar as colunas que uma função devolve exige apagá-la e criá-la de novo. O corpo é o mesmo da
-- migração 20261104183304_harden_searches, mais is_sensitive. Nenhuma política de RLS muda.

drop function public.search_places(text, double precision, double precision);

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
  is_sensitive boolean,
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
      place.is_sensitive,
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
    matches.is_sensitive,
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

revoke execute on function public.search_places(text, double precision, double precision) from public, anon;
grant execute on function public.search_places(text, double precision, double precision) to authenticated;
