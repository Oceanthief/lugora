-- "Lugares perto de mim" (Fatia 4): com o GPS ligado e nada digitado, a tela de registro mostra os
-- lugares mais próximos. Mesmas regras da distância na busca (seção 9.1): só com o consentimento de
-- localização, e a posição serve só para este cálculo; a função não grava nada.
-- Nenhuma política de RLS muda: a função roda com as permissões de quem chama.

insert into public.app_parameters (key, value, description) values
  (
    'nearby_places_radius_meters',
    '300',
    'Registrar: até que distância da posição do celular vão os "lugares perto de mim". A posição não fica guardada.'
  ),
  (
    'nearby_places_limit',
    '10',
    'Registrar: quantos "lugares perto de mim" a tela mostra, do mais perto para o mais longe.'
  );

create function public.nearby_places(p_latitude double precision, p_longitude double precision)
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
  with origin as (
    select extensions.ST_SetSRID(extensions.ST_MakePoint(p_longitude, p_latitude), 4326)::extensions.geography as point
    where p_latitude between -90 and 90
      and p_longitude between -180 and 180
      -- Sem o consentimento mais recente, não há origem, e a função não devolve nada.
      and coalesce((
        select consent.granted
        from public.consents as consent
        where consent.user_id = (select auth.uid())
          and consent.purpose = 'precise_location'
        order by consent.created_at desc
        limit 1
      ), false)
  )
  select
    place.id,
    place.name,
    place.address,
    coalesce(place.category_override, place.category),
    place.is_visitable,
    place.is_sensitive,
    extensions.ST_Distance(place.location, origin.point)::double precision as distance_meters
  from public.places as place
  cross join origin
  where place.status = 'active'
    -- Só lugares para visitar: perto de mim, um escritório ou um condomínio só atrapalham.
    and place.is_visitable
    and extensions.ST_DWithin(
      place.location,
      origin.point,
      (select (value #>> '{}')::double precision from public.app_parameters where key = 'nearby_places_radius_meters')
    )
  order by distance_meters, place.name, place.id
  limit (select (value #>> '{}')::int from public.app_parameters where key = 'nearby_places_limit');
$$;

revoke execute on function public.nearby_places(double precision, double precision) from public, anon;
grant execute on function public.nearby_places(double precision, double precision) to authenticated;
