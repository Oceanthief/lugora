import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { checkRules, CURRENT_USER_ID, generateDemo } from "./seed-demo.mjs";

const places = JSON.parse(readFileSync(new URL("../src/data/places.json", import.meta.url), "utf8"));
const demo = generateDemo(places);
const placeById = new Map(places.map((place) => [place.id, place]));

describe("generateDemo", () => {
  it("dá sempre o mesmo resultado com a semente 42", () => {
    expect(generateDemo(places)).toEqual(demo);
  });

  it("bate com o demo.json salvo (rode npm run seed:demo se mudar o script ou os lugares)", () => {
    const saved = JSON.parse(readFileSync(new URL("../src/data/demo.json", import.meta.url), "utf8"));
    expect(saved).toEqual(demo);
  });

  it("tem o Victor como usuário logado, mais 11 pessoas, e ele segue 8", () => {
    expect(demo.users.find((user) => user.id === CURRENT_USER_ID)).toMatchObject({
      name: "Victor Ramos",
      username: "victorramos",
      homeCityId: "jf",
    });
    expect(demo.users).toHaveLength(12);
    expect(demo.follows).toHaveLength(8);
    expect(demo.follows.every((follow) => follow.followerId === CURRENT_USER_ID)).toBe(true);
  });

  it("dá 18 visitas ao Victor e de 8 a 25 a cada outra pessoa, cerca de 200 no total", () => {
    const perUser = Map.groupBy(demo.visits, (visit) => visit.userId);
    expect(perUser.get(CURRENT_USER_ID)).toHaveLength(18);
    for (const [userId, list] of perUser) {
      if (userId !== CURRENT_USER_ID) expect(list.length, userId).toBeGreaterThanOrEqual(8);
      if (userId !== CURRENT_USER_ID) expect(list.length, userId).toBeLessThanOrEqual(25);
    }
    expect(demo.visits).toHaveLength(200);
  });

  it("nunca põe Romântico em padaria ou livraria", () => {
    for (const visit of demo.visits) {
      if (["bakery", "bookstore"].includes(placeById.get(visit.placeId).category)) {
        expect(visit.occasions, visit.id).not.toContain("romantic");
      }
    }
  });

  it("não altera nenhum lugar", () => {
    const before = JSON.stringify(places);
    generateDemo(places);
    expect(JSON.stringify(places)).toBe(before);
  });
});

describe("checkRules", () => {
  const popularIds = new Set(
    places.filter((place) => /Cine-Theatro|Mariano Procópio|Parque Halfeld|Morro do Imperador/.test(place.name)).map((place) => place.id),
  );

  it("aceita o resultado gerado", () => {
    expect(() => checkRules(demo, places, popularIds)).not.toThrow();
  });

  it("recusa nota abaixo de 2,0", () => {
    const broken = structuredClone(demo);
    broken.visits[0].rating = 1.5;
    expect(() => checkRules(broken, places, popularIds)).toThrow(/nota 1.5/);
  });

  it("recusa notas do mesmo lugar com mais de 1,5 de diferença", () => {
    const broken = structuredClone(demo);
    const [placeId] = [...Map.groupBy(broken.visits, (visit) => visit.placeId)].find(([, list]) => list.length >= 2);
    const [first, second] = broken.visits.filter((visit) => visit.placeId === placeId);
    first.rating = 5;
    second.rating = 3;
    expect(() => checkRules(broken, places, popularIds)).toThrow(/notas muito distantes/);
  });

  it("recusa Romântico numa padaria", () => {
    const broken = structuredClone(demo);
    const visit = broken.visits.find((v) => placeById.get(v.placeId).category === "bakery");
    visit.occasions = ["romantic"];
    expect(() => checkRules(broken, places, popularIds)).toThrow(/romantic em bakery/);
  });
});
