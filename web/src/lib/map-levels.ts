/**
 * As faixas de cor do mapa (seção 7.4, camada 2): cada cidade ganha um nível
 * de 1 a 4 pelo número de lugares distintos visitados nela. Visitar o mesmo
 * lugar de novo não esquenta o mapa. Sem rede nem banco: coberto por
 * map-levels.test.ts.
 */

import type { LngLat, MyVisitedPlace } from "./visited-places";

/** Onde começa cada nível, em lugares distintos. O valor que vale vem do banco (`map_city_levels`). */
export const DEFAULT_CITY_LEVELS: readonly number[] = [1, 2, 6, 16];

/** Confere o parâmetro que vem do banco: 4 números inteiros, crescentes, a partir de 1. */
export function isLevelList(value: unknown): value is number[] {
  return (
    Array.isArray(value) &&
    value.length === 4 &&
    value.every((item, index) => Number.isInteger(item) && item >= 1 && (index === 0 || item > value[index - 1]))
  );
}

/** O nível de 1 a 4 de quem tem `places` lugares distintos; 0 se ainda não chega ao primeiro. */
export function levelFor(places: number, levels: readonly number[]): number {
  let level = 0;
  levels.forEach((start, index) => {
    if (places >= start) level = index + 1;
  });
  return level;
}

/** O intervalo de cada nível, para a legenda: [1, 1], [2, 5], [6, 15], [16, null]. */
export function levelRanges(levels: readonly number[]): [from: number, to: number | null][] {
  return levels.map((start, index) => [start, index + 1 < levels.length ? levels[index + 1] - 1 : null]);
}

export type CitySummary = {
  id: string;
  name: string;
  state: string | null;
  countryCode: string;
  location: LngLat;
  /** Lugares distintos visitados na cidade. */
  places: number;
  level: number;
};

/** As cidades do mapa, da que tem mais lugares para a que tem menos. */
export function summarizeCities(
  places: readonly Pick<MyVisitedPlace, "id" | "city">[],
  levels: readonly number[],
): CitySummary[] {
  const byCity = new Map<string, { city: MyVisitedPlace["city"]; placeIds: Set<string> }>();
  for (const place of places) {
    const entry = byCity.get(place.city.id) ?? { city: place.city, placeIds: new Set<string>() };
    entry.placeIds.add(place.id);
    byCity.set(place.city.id, entry);
  }

  return [...byCity.values()]
    .map(({ city, placeIds }) => ({
      id: city.id,
      name: city.name,
      state: city.state,
      countryCode: city.countryCode,
      location: city.location,
      places: placeIds.size,
      level: levelFor(placeIds.size, levels),
    }))
    .sort((a, b) => b.places - a.places || a.name.localeCompare(b.name, "pt-BR"));
}

export type MapTab = "home" | "trips";

/**
 * Abas do mapa (seção 7.4): Minha cidade e Viagens. Vale a visita mais
 * recente a cada lugar, gravada com is_resident no momento da visita.
 */
export function placesInTab<T extends Pick<MyVisitedPlace, "isResident">>(places: readonly T[], tab: MapTab): T[] {
  return places.filter((place) => place.isResident === (tab === "home"));
}
