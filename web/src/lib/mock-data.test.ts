import { describe, expect, it } from "vitest";

import {
  getCity,
  getFeed,
  getVisitedPlaces,
  getWantToGo,
  mockFeedVisits,
  mockPlaces,
  mockVisits,
  mockWantToGo,
} from "./mock-data";
import type { FeedVisit, MockPlace, MockVisit } from "./mock-data";

describe("dados fictícios", () => {
  it("põe cada lugar perto do centro da sua cidade", () => {
    // Pega a troca de longitude com latitude, o erro mais comum com mapas.
    for (const place of mockPlaces) {
      const city = getCity(place.cityId);
      expect(city, place.id).toBeDefined();
      const [lng, lat] = place.location;
      expect(Math.abs(lng - city!.center[0]), place.id).toBeLessThan(0.15);
      expect(Math.abs(lat - city!.center[1]), place.id).toBeLessThan(0.15);
    }
  });

  it("liga cada visita e cada item do Quero ir a um lugar que existe", () => {
    const ids = new Set(mockPlaces.map((place) => place.id));
    for (const { placeId } of [...mockVisits, ...mockFeedVisits, ...mockWantToGo]) {
      expect(ids.has(placeId), placeId).toBe(true);
    }
  });

  it("usa notas de 0,5 a 5, em passos de 0,5, e até 3 ocasiões", () => {
    for (const visit of [...mockVisits, ...mockFeedVisits]) {
      expect(visit.rating).toBeGreaterThanOrEqual(0.5);
      expect(visit.rating).toBeLessThanOrEqual(5);
      expect(Number.isInteger(visit.rating * 2)).toBe(true);
      expect(visit.occasions.length).toBeLessThanOrEqual(3);
    }
  });
});

describe("getVisitedPlaces", () => {
  const places: MockPlace[] = [
    { id: "a", name: "A", category: "cafe", cityId: "jf", location: [-43.35, -21.76] },
    { id: "b", name: "B", category: "bar", cityId: "jf", location: [-43.36, -21.77] },
  ];

  it("conta o mesmo lugar uma vez só, com a visita mais recente", () => {
    const visits: MockVisit[] = [
      { id: "1", placeId: "a", visitedOn: "2026-10-25", rating: 4.5, occasions: [] },
      { id: "2", placeId: "a", visitedOn: "2026-09-12", rating: 2, occasions: [] },
    ];

    const result = getVisitedPlaces(places, visits);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: "a", visitedOn: "2026-10-25", rating: 4.5 });
  });

  it("deixa de fora os lugares sem visita", () => {
    const visits: MockVisit[] = [
      { id: "1", placeId: "b", visitedOn: "2026-10-01", rating: 3, occasions: [] },
    ];

    expect(getVisitedPlaces(places, visits).map((p) => p.id)).toEqual(["b"]);
  });
});

describe("getFeed", () => {
  it("mostra da visita mais recente para a mais antiga", () => {
    const dates = getFeed().map((item) => item.visit.visitedOn);
    expect(dates).toEqual([...dates].sort().reverse());
  });

  it("desempata visitas do mesmo dia sempre na mesma ordem", () => {
    const visits: FeedVisit[] = [
      { id: "f2", userId: "u1", placeId: "p1", visitedOn: "2026-10-27", rating: 4, occasions: [] },
      { id: "f1", userId: "u2", placeId: "p2", visitedOn: "2026-10-27", rating: 3, occasions: [] },
    ];
    expect(getFeed(visits).map((item) => item.visit.id)).toEqual(["f1", "f2"]);
  });
});

describe("getWantToGo", () => {
  it("mostra primeiro o que foi adicionado por último", () => {
    const dates = getWantToGo().map((entry) => entry.item.addedOn);
    expect(dates).toEqual([...dates].sort().reverse());
  });

  it("só tem lugares que ainda não foram visitados", () => {
    const visited = new Set(mockVisits.map((visit) => visit.placeId));
    for (const { place } of getWantToGo()) {
      expect(visited.has(place.id), place.id).toBe(false);
    }
  });
});
