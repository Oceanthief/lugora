import { describe, expect, it } from "vitest";

import type { MockCity, MockPlace, MockVisit } from "./mock-data";
import { computeProfileStats, describeTravel, MIN_VISITS_FOR_TRAVEL_SHARE } from "./stats";

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
    userId: "u0",
    placeId,
    visitedOn: "2026-10-01",
    rating: 4,
    occasions: [],
  }));
}

const statsFor = (home: number, away: number) =>
  computeProfileStats({
    visits: [...visitsTo("casa", home), ...visitsTo("fora", away)],
    places,
    cities,
    homeCityId: "jf",
  });

describe("computeProfileStats", () => {
  it("conta lugares, cidades, países e viagens", () => {
    expect(statsFor(3, 1)).toEqual({
      countryCodes: ["BR", "PT"],
      cityIds: ["jf", "lisboa"],
      places: 2,
      visits: 4,
      travelVisits: 1,
    });
  });

  it("conta como viagem só a visita fora da cidade onde a pessoa mora", () => {
    expect(statsFor(12, 0).travelVisits).toBe(0);
    expect(statsFor(0, 5).travelVisits).toBe(5);
  });
});

describe("describeTravel", () => {
  it("espera o mínimo de visitas antes de mostrar o eixo Onde", () => {
    expect(describeTravel(statsFor(MIN_VISITS_FOR_TRAVEL_SHARE - 1, 0))).toEqual({ kind: "locked", missing: 1 });
  });

  it("calcula a % de visitas em viagem a partir do mínimo", () => {
    expect(describeTravel(statsFor(9, 3))).toEqual({ kind: "share", percent: 25 });
  });

  it("sem nenhuma viagem, não mostra 0%", () => {
    expect(describeTravel(statsFor(18, 0))).toEqual({ kind: "none" });
  });

  it("com viagem que arredondaria para 0%, diz menos de 1%", () => {
    // 1 em 250 visitas = 0,4%.
    expect(describeTravel(statsFor(249, 1))).toEqual({ kind: "underOne" });
  });
});
