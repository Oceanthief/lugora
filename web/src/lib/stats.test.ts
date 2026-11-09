import { describe, expect, it } from "vitest";

import { computeProfileStats, describeTravel, MIN_VISITS_FOR_TRAVEL_SHARE } from "./stats";

const juizDeFora = { id: "jf", name: "Juiz de Fora", state: "MG", countryCode: "BR", location: [-43.35, -21.76] as [number, number] };
const lisboa = { id: "lisboa", name: "Lisboa", state: null, countryCode: "PT", location: [-9.14, 38.72] as [number, number] };

/** Um lugar em casa visitado `home` vezes e um em viagem visitado `away` vezes. */
const statsFor = (home: number, away: number) =>
  computeProfileStats([
    ...(home > 0 ? [{ city: juizDeFora, visitCount: home, awayVisitCount: 0 }] : []),
    ...(away > 0 ? [{ city: lisboa, visitCount: away, awayVisitCount: away }] : []),
  ]);

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

  it("visitar o mesmo lugar de novo conta visita, não lugar", () => {
    const stats = statsFor(2, 0);
    expect(stats.places).toBe(1);
    expect(stats.visits).toBe(2);
  });

  it("conta como viagem só a visita fora da cidade onde a pessoa mora", () => {
    expect(statsFor(12, 0).travelVisits).toBe(0);
    expect(statsFor(0, 5).travelVisits).toBe(5);
  });

  it("conta a viagem gravada em cada visita, mesmo num lugar hoje em casa", () => {
    // Quem se mudou para Lisboa: as visitas antigas, de quando morava fora, continuam viagens.
    const stats = computeProfileStats([{ city: lisboa, visitCount: 3, awayVisitCount: 2 }]);
    expect(stats.travelVisits).toBe(2);
  });

  it("sem visitas, tudo zera", () => {
    expect(computeProfileStats([])).toEqual({ countryCodes: [], cityIds: [], places: 0, visits: 0, travelVisits: 0 });
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
