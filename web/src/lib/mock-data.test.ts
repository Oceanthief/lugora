import { describe, expect, it } from "vitest";

import { placeCategories } from "./categories";
import {
  getCity,
  getFeed,
  getVisitedPlaces,
  getWantToGo,
  mockAllVisits,
  mockFeedVisits,
  mockFollowing,
  mockPlaces,
  mockProfile,
  mockUsers,
  mockVisits,
  mockWantToGo,
} from "./mock-data";
import type { MockPlace, MockVisit } from "./mock-data";
import { occasions } from "./occasions";

describe("dados do app", () => {
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

  it("põe todos os lugares dentro de Juiz de Fora", () => {
    for (const { name, location } of mockPlaces) {
      const [lng, lat] = location;
      expect(lat, name).toBeGreaterThanOrEqual(-21.84);
      expect(lat, name).toBeLessThanOrEqual(-21.68);
      expect(lng, name).toBeGreaterThanOrEqual(-43.44);
      expect(lng, name).toBeLessThanOrEqual(-43.3);
    }
  });

  it("não repete lugar nem id do Overture", () => {
    const ids = mockPlaces.map((place) => place.id);
    const gersIds = mockPlaces.flatMap((place) => (place.gersId ? [place.gersId] : []));
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(gersIds).size).toBe(gersIds.length);
  });

  it("usa só categorias que existem no app", () => {
    for (const { name, category } of mockPlaces) {
      expect(placeCategories, name).toContain(category);
    }
  });

  it("liga cada visita e cada item do Quero ir a um lugar que existe", () => {
    const ids = new Set(mockPlaces.map((place) => place.id));
    for (const { placeId } of [...mockAllVisits, ...mockWantToGo]) {
      expect(ids.has(placeId), placeId).toBe(true);
    }
  });

  it("liga cada visita a uma pessoa que existe", () => {
    const ids = new Set(mockUsers.map((user) => user.id));
    for (const visit of mockAllVisits) {
      expect(ids.has(visit.userId), visit.id).toBe(true);
    }
  });

  it("usa notas de 0,5 a 5, em passos de 0,5, e até 3 ocasiões do app", () => {
    for (const visit of mockAllVisits) {
      expect(visit.rating).toBeGreaterThanOrEqual(0.5);
      expect(visit.rating).toBeLessThanOrEqual(5);
      expect(Number.isInteger(visit.rating * 2)).toBe(true);
      expect(visit.occasions.length).toBeLessThanOrEqual(3);
      for (const occasion of visit.occasions) expect(occasions, visit.id).toContain(occasion);
    }
  });
});

describe("usuário logado e quem ele segue", () => {
  it("é o Victor Ramos, que mora em Juiz de Fora", () => {
    expect(mockProfile).toMatchObject({ name: "Victor Ramos", username: "victorramos", homeCityId: "jf" });
  });

  it("não entrega a cidade de residência de mais ninguém (seção 9.3)", () => {
    for (const user of mockUsers) expect(user, user.id).not.toHaveProperty("homeCityId");
    for (const item of getFeed()) expect(item.user, item.visit.id).not.toHaveProperty("homeCityId");
  });

  it("só mostra no perfil e no mapa as visitas do próprio Victor", () => {
    expect(mockVisits.length).toBeGreaterThan(0);
    for (const visit of mockVisits) expect(visit.userId).toBe(mockProfile.id);
  });

  it("monta o Feed só com visitas de quem ele segue, e nenhuma dele", () => {
    const followed = new Set(mockFollowing.map((user) => user.id));
    expect(followed.has(mockProfile.id)).toBe(false);
    expect(mockFeedVisits.length).toBeGreaterThan(0);
    for (const visit of mockFeedVisits) expect(followed.has(visit.userId), visit.id).toBe(true);
  });
});

describe("getVisitedPlaces", () => {
  const places: MockPlace[] = [
    { id: "a", name: "A", category: "cafe", cityId: "jf", location: [-43.35, -21.76] },
    { id: "b", name: "B", category: "bar", cityId: "jf", location: [-43.36, -21.77] },
  ];

  it("conta o mesmo lugar uma vez só, com a visita mais recente", () => {
    const visits: MockVisit[] = [
      { id: "1", userId: "u0", placeId: "a", visitedOn: "2026-10-25", rating: 4.5, occasions: [] },
      { id: "2", userId: "u0", placeId: "a", visitedOn: "2026-09-12", rating: 2, occasions: [] },
    ];

    const result = getVisitedPlaces(places, visits);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: "a", visitedOn: "2026-10-25", rating: 4.5 });
  });

  it("deixa de fora os lugares sem visita", () => {
    const visits: MockVisit[] = [
      { id: "1", userId: "u0", placeId: "b", visitedOn: "2026-10-01", rating: 3, occasions: [] },
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
    const [a, b] = mockPlaces;
    const visits: MockVisit[] = [
      { id: "f2", userId: "u1", placeId: a.id, visitedOn: "2026-10-27", rating: 4, occasions: [] },
      { id: "f1", userId: "u2", placeId: b.id, visitedOn: "2026-10-27", rating: 3, occasions: [] },
    ];
    expect(getFeed(visits).map((item) => item.visit.id)).toEqual(["f1", "f2"]);
  });
});

describe("getWantToGo", () => {
  it("mostra primeiro o que foi adicionado por último", () => {
    const dates = getWantToGo().map((entry) => entry.item.addedOn);
    expect(dates).toEqual([...dates].sort().reverse());
  });

  it("é a lista do Victor, só com lugares que ele ainda não visitou", () => {
    const visited = new Set(mockVisits.map((visit) => visit.placeId));
    expect(getWantToGo().length).toBeGreaterThan(0);
    for (const { item, place } of getWantToGo()) {
      expect(item.userId).toBe(mockProfile.id);
      expect(visited.has(place.id), place.id).toBe(false);
    }
  });
});
