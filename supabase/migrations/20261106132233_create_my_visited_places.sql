-- O mapa e os números do próprio perfil (seções 7.4 e 7.12).

-- Faixas de cor das cidades no mapa (seção 7.4): onde começa cada nível, em lugares distintos.
insert into public.app_parameters (key, value, description) values (
  'map_city_levels',
  '[1, 2, 6, 16]',
  'Mapa: número de lugares distintos de uma cidade em que começam os níveis 1 a 4 da cor (seção 7.4).'
);

-- Um registro por lugar que a pessoa visitou: visitar de novo não conta outro lugar (seção 7.4).
-- A nota e a aba (Minha cidade ou Viagens) vêm da visita mais recente (seção 7.1).
--
-- Roda com as permissões do dono da função porque precisa de is_resident, gravado no momento de
-- cada visita, e da ordem dos registros: colunas que a API não entrega a ninguém, nem à dona, porque
-- a permissão de coluna vale para todo mundo. É seguro porque a função não recebe nenhum parâmetro
-- e devolve só as visitas de quem chama (auth.uid()); sem sessão, não devolve nada. Não devolve a
-- hora de nada. O teste 00_guardrails lista as funções assim.
create function public.my_visited_places()
returns table (
  place_id uuid,
  name text,
  category text,
  latitude double precision,
  longitude double precision,
  city_id uuid,
  city_name text,
  city_state text,
  city_latitude double precision,
  city_longitude double precision,
  country_code text,
  is_resident boolean,
  rating numeric,
  last_visited_on date,
  visit_count integer,
  away_visit_count integer
)
language sql
stable
security definer
set search_path = ''
as $$
  with mine as (
    select visit.place_id, visit.rating, visit.visited_on, visit.is_resident, visit.created_at
    from public.visits as visit
    where visit.user_id = (select auth.uid())
  ),
  -- No mesmo dia, vale a registrada por último.
  latest as (
    select distinct on (mine.place_id)
      mine.place_id, mine.rating, mine.visited_on, mine.is_resident
    from mine
    order by mine.place_id, mine.visited_on desc, mine.created_at desc
  ),
  counts as (
    select
      mine.place_id,
      count(*)::integer as visit_count,
      (count(*) filter (where not mine.is_resident))::integer as away_visit_count
    from mine
    group by mine.place_id
  ),
  -- Um ponto dentro do limite de cada cidade visitada, calculado uma vez por cidade.
  visited_cities as (
    select distinct place.city_id
    from latest
    join public.places as place on place.id = latest.place_id
  ),
  city_points as (
    select
      city.id,
      city.name,
      city.state,
      country.iso_code,
      extensions.ST_PointOnSurface(city.boundary::extensions.geometry) as point
    from visited_cities
    join public.cities as city on city.id = visited_cities.city_id
    join public.countries as country on country.id = city.country_id
  )
  select
    place.id,
    place.name,
    coalesce(place.category_override, place.category),
    extensions.ST_Y(place.location::extensions.geometry),
    extensions.ST_X(place.location::extensions.geometry),
    city_points.id,
    city_points.name,
    city_points.state,
    extensions.ST_Y(city_points.point),
    extensions.ST_X(city_points.point),
    city_points.iso_code,
    latest.is_resident,
    latest.rating,
    latest.visited_on,
    counts.visit_count,
    counts.away_visit_count
  from latest
  join counts on counts.place_id = latest.place_id
  join public.places as place on place.id = latest.place_id
  join city_points on city_points.id = place.city_id
  order by latest.visited_on desc, place.name;
$$;

revoke execute on function public.my_visited_places() from public, anon;
grant execute on function public.my_visited_places() to authenticated;
