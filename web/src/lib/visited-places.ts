/**
 * Os lugares do próprio mapa, como chegam de `my_visited_places`: uma linha
 * por lugar, mesmo com várias visitas (seção 7.4). Sem rede nem banco, para o
 * mapa (no navegador) e o perfil (no servidor) usarem o mesmo tipo.
 */

/** [longitude, latitude], a ordem do MapLibre. */
export type LngLat = [number, number];

export type MyVisitedPlace = {
  id: string;
  name: string;
  category: string | null;
  location: LngLat;
  city: {
    id: string;
    name: string;
    state: string | null;
    countryCode: string;
    /** Um ponto dentro do limite da cidade, para o mapa de cidades. */
    location: LngLat;
  };
  /** A visita mais recente foi na cidade onde a pessoa morava: aba Minha cidade. */
  isResident: boolean;
  /** A nota da visita mais recente (seção 7.1). */
  rating: number;
  /** AAAA-MM-DD. */
  lastVisitedOn: string;
  visitCount: number;
  /** Visitas a este lugar feitas em viagem, fora da cidade de residência. */
  awayVisitCount: number;
};

/** Os tipos gerados pelo Supabase não enxergam os nulos de uma função que devolve uma tabela. */
export function toMyVisitedPlace(row: {
  place_id: string;
  name: string;
  category: string | null;
  latitude: number;
  longitude: number;
  city_id: string;
  city_name: string;
  city_state: string | null;
  city_latitude: number;
  city_longitude: number;
  country_code: string;
  is_resident: boolean;
  rating: number;
  last_visited_on: string;
  visit_count: number;
  away_visit_count: number;
}): MyVisitedPlace {
  return {
    id: row.place_id,
    name: row.name,
    category: row.category,
    location: [row.longitude, row.latitude],
    city: {
      id: row.city_id,
      name: row.city_name,
      state: row.city_state,
      countryCode: row.country_code,
      location: [row.city_longitude, row.city_latitude],
    },
    isResident: row.is_resident,
    rating: Number(row.rating),
    lastVisitedOn: row.last_visited_on,
    visitCount: row.visit_count,
    awayVisitCount: row.away_visit_count,
  };
}
