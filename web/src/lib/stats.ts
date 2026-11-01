import type { MockCity, MockPlace, MockVisit } from "./mock-data";

/** Visitas mínimas para mostrar o eixo Onde (parâmetro, seção 7.12). */
export const MIN_VISITS_FOR_TRAVEL_SHARE = 10;

export type ProfileStats = {
  /** Códigos dos países visitados, em ordem alfabética. */
  countryCodes: string[];
  cities: number;
  /** Lugares distintos: visitar de novo não conta duas vezes (seção 7.4). */
  places: number;
  visits: number;
  /** % das visitas fora da cidade de residência; null antes do mínimo. */
  travelSharePercent: number | null;
};

/**
 * Estatísticas do próprio perfil.
 *
 * Simplificação da Fatia 0: "em viagem" é a visita a um lugar fora da cidade
 * de residência atual. A regra de verdade usa `is_resident`, gravado no
 * momento de cada visita (Fatia 4).
 */
export function computeProfileStats({
  visits,
  places,
  cities,
  homeCityId,
}: {
  visits: readonly MockVisit[];
  places: readonly MockPlace[];
  cities: readonly MockCity[];
  homeCityId: string;
}): ProfileStats {
  const placeById = new Map(places.map((place) => [place.id, place]));
  const cityById = new Map(cities.map((city) => [city.id, city]));

  const placeIds = new Set<string>();
  const cityIds = new Set<string>();
  const countryCodes = new Set<string>();
  let travelVisits = 0;

  for (const visit of visits) {
    const place = placeById.get(visit.placeId);
    if (!place) continue;

    placeIds.add(place.id);
    cityIds.add(place.cityId);
    const countryCode = cityById.get(place.cityId)?.countryCode;
    if (countryCode) countryCodes.add(countryCode);
    if (place.cityId !== homeCityId) travelVisits++;
  }

  return {
    countryCodes: [...countryCodes].sort(),
    cities: cityIds.size,
    places: placeIds.size,
    visits: visits.length,
    travelSharePercent:
      visits.length >= MIN_VISITS_FOR_TRAVEL_SHARE
        ? Math.round((travelVisits / visits.length) * 100)
        : null,
  };
}
