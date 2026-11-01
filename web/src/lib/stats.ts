import type { MockCity, MockPlace, MockVisit } from "./mock-data";

/** Visitas mínimas para mostrar o eixo Onde (parâmetro, seção 7.12). */
export const MIN_VISITS_FOR_TRAVEL_SHARE = 10;

export type ProfileStats = {
  /** Códigos dos países visitados, em ordem alfabética. */
  countryCodes: string[];
  /** Ids das cidades visitadas, em ordem alfabética. */
  cityIds: string[];
  /** Lugares distintos: visitar de novo não conta duas vezes (seção 7.4). */
  places: number;
  visits: number;
  /** Visitas fora da cidade de residência (veja computeProfileStats). */
  travelVisits: number;
};

/**
 * Estatísticas do próprio perfil.
 *
 * Simplificação da Fatia 0: "em viagem" é a visita a um lugar fora da cidade
 * de residência atual. A regra de verdade usa `is_resident`, gravado no
 * momento de cada visita (Fatia 4): assim, quem se muda não vê as visitas à
 * cidade antiga virarem viagens.
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
    cityIds: [...cityIds].sort(),
    places: placeIds.size,
    visits: visits.length,
    travelVisits,
  };
}

/** O que o card "Seu jeito de viajar" deve dizer. */
export type TravelSummary =
  | { kind: "locked"; missing: number }
  | { kind: "none" }
  | { kind: "underOne" }
  | { kind: "share"; percent: number };

/**
 * Decide a mensagem do eixo Onde (seção 7.12): só aparece a partir do mínimo
 * de visitas. Sem nenhuma viagem, a tela convida a registrar uma; com poucas,
 * "menos de 1%" em vez de um 0% arredondado que esconderia a viagem.
 */
export function describeTravel(stats: ProfileStats): TravelSummary {
  if (stats.visits < MIN_VISITS_FOR_TRAVEL_SHARE) {
    return { kind: "locked", missing: MIN_VISITS_FOR_TRAVEL_SHARE - stats.visits };
  }
  if (stats.travelVisits === 0) return { kind: "none" };
  const percent = Math.round((stats.travelVisits / stats.visits) * 100);
  return percent === 0 ? { kind: "underOne" } : { kind: "share", percent };
}
