import { describe, expect, it } from "vitest";

import type { MockCity, MockPlace, MockVisit } from "./mock-data";
import { computeProfileStats, MIN_VISITS_FOR_TRAVEL_SHARE } from "./stats";

const cities: MockCity[] = [
  { id: "jf", name: "Juiz de Fora", countryCode: "BR", center: [-43.35, -21.76] },
  { id: "lisboa", name: "Lisboa", countryCode: "PT", center: [-9.14, 38.72] },
];

const places: MockPlace[] = [
  { id: "casa", name: "Casa", category: "cafe", cityId: "jf", location: [-43.35, -21.76] },
  { id: "fora", name: "Fora", category: "bar", cityId: "lisboa", location: [-9.14, 38.72] },
];

function visitsTo(placeId: string, count: number): MockVisit[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${placeId}-${i}`,
    placeId,
    visitedOn: "2026-10-01",
    rating: 4,
    occasions: [],
  }));
}

describe("computeProfileStats", () => {
  it("conta lugares, cidades e países distintos", () => {
    const stats = computeProfileStats({
      visits: [...visitsTo("casa", 3), ...visitsTo("fora", 1)],
      places,
      cities,
      homeCityId: "jf",
    });

    expect(stats).toMatchObject({
      countryCodes: ["BR", "PT"],
      cities: 2,
      places: 2,
      visits: 4,
    });
  });

  it("esconde o eixo Onde antes do mínimo de visitas", () => {
    const stats = computeProfileStats({
      visits: visitsTo("casa", MIN_VISITS_FOR_TRAVEL_SHARE - 1),
      places,
      cities,
      homeCityId: "jf",
    });

    expect(stats.travelSharePercent).toBeNull();
  });

  it("calcula a % de visitas em viagem a partir do mínimo", () => {
    const stats = computeProfileStats({
      visits: [...visitsTo("casa", 9), ...visitsTo("fora", 3)],
      places,
      cities,
      homeCityId: "jf",
    });

    expect(stats.travelSharePercent).toBe(25);
  });
});
