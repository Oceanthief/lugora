import { describe, expect, it } from "vitest";

import { getVisitedPlaces, mockPlaces, mockVisits } from "./mock-data";
import type { MockPlace, MockVisit } from "./mock-data";

describe("dados fictícios", () => {
  it("põe todos os lugares em Juiz de Fora", () => {
    // Pega a troca de longitude com latitude, o erro mais comum com mapas.
    for (const { location } of mockPlaces) {
      const [lng, lat] = location;
      expect(lng).toBeGreaterThan(-43.45);
      expect(lng).toBeLessThan(-43.25);
      expect(lat).toBeGreaterThan(-21.85);
      expect(lat).toBeLessThan(-21.65);
    }
  });

  it("liga cada visita a um lugar que existe", () => {
    const ids = new Set(mockPlaces.map((place) => place.id));
    for (const visit of mockVisits) {
      expect(ids.has(visit.placeId)).toBe(true);
    }
  });

  it("usa notas de 0,5 a 5, em passos de 0,5", () => {
    for (const { rating } of mockVisits) {
      expect(rating).toBeGreaterThanOrEqual(0.5);
      expect(rating).toBeLessThanOrEqual(5);
      expect(Number.isInteger(rating * 2)).toBe(true);
    }
  });
});

describe("getVisitedPlaces", () => {
  const places: MockPlace[] = [
    { id: "a", name: "A", category: "cafe", location: [-43.35, -21.76] },
    { id: "b", name: "B", category: "bar", location: [-43.36, -21.77] },
  ];

  it("conta o mesmo lugar uma vez só, com a visita mais recente", () => {
    const visits: MockVisit[] = [
      { id: "1", placeId: "a", visitedOn: "2026-10-25", rating: 4.5 },
      { id: "2", placeId: "a", visitedOn: "2026-09-12", rating: 2 },
    ];

    const result = getVisitedPlaces(places, visits);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: "a", visitedOn: "2026-10-25", rating: 4.5 });
  });

  it("deixa de fora os lugares sem visita", () => {
    const visits: MockVisit[] = [
      { id: "1", placeId: "b", visitedOn: "2026-10-01", rating: 3 },
    ];

    expect(getVisitedPlaces(places, visits).map((p) => p.id)).toEqual(["b"]);
  });
});
