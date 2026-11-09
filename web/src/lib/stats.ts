import type { MyVisitedPlace } from "./visited-places";

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
  /** Visitas em viagem, fora da cidade de residência (veja computeProfileStats). */
  travelVisits: number;
};

/**
 * Estatísticas do próprio perfil, a partir dos lugares do próprio mapa (uma
 * linha por lugar). "Em viagem" usa `is_resident`, gravado no momento de cada
 * visita: assim, quem se muda não vê as visitas à cidade antiga virarem viagens.
 */
export function computeProfileStats(
  places: readonly Pick<MyVisitedPlace, "city" | "visitCount" | "awayVisitCount">[],
): ProfileStats {
  const cityIds = new Set<string>();
  const countryCodes = new Set<string>();
  let visits = 0;
  let travelVisits = 0;

  for (const place of places) {
    cityIds.add(place.city.id);
    countryCodes.add(place.city.countryCode);
    visits += place.visitCount;
    travelVisits += place.awayVisitCount;
  }

  return {
    countryCodes: [...countryCodes].sort(),
    cityIds: [...cityIds].sort(),
    places: places.length,
    visits,
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
