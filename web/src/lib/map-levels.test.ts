import { describe, expect, it } from "vitest";

import {
  DEFAULT_CITY_LEVELS,
  isLevelList,
  levelFor,
  levelRanges,
  placesInTab,
  summarizeCities,
} from "./map-levels";

const juizDeFora = { id: "jf", name: "Juiz de Fora", state: "MG", countryCode: "BR", location: [-43.35, -21.76] as [number, number] };
const lisboa = { id: "lisboa", name: "Lisboa", state: null, countryCode: "PT", location: [-9.14, 38.72] as [number, number] };

describe("levelFor (faixas da seção 7.4)", () => {
  it.each([
    [0, 0],
    [1, 1],
    [2, 2],
    [5, 2],
    [6, 3],
    [15, 3],
    [16, 4],
    [200, 4],
  ])("%d lugares distintos ficam no nível %d", (places, level) => {
    expect(levelFor(places, DEFAULT_CITY_LEVELS)).toBe(level);
  });

  it("usa as faixas que vêm do banco", () => {
    expect(levelFor(3, [1, 3, 10, 50])).toBe(2);
  });
});

describe("levelRanges (legenda)", () => {
  it("monta os intervalos 1, 2 a 5, 6 a 15 e 16 ou mais", () => {
    expect(levelRanges(DEFAULT_CITY_LEVELS)).toEqual([
      [1, 1],
      [2, 5],
      [6, 15],
      [16, null],
    ]);
  });
});

describe("isLevelList", () => {
  it("aceita as faixas padrão", () => {
    expect(isLevelList([1, 2, 6, 16])).toBe(true);
  });

  it.each([
    ["fora de uma lista", "1,2,6,16"],
    ["com 3 faixas", [1, 2, 6]],
    ["fora de ordem", [1, 6, 2, 16]],
    ["com zero", [0, 2, 6, 16]],
    ["com fração", [1, 2.5, 6, 16]],
  ])("recusa %s", (_, value) => {
    expect(isLevelList(value)).toBe(false);
  });
});

describe("summarizeCities", () => {
  it("aceite: duas visitas ao mesmo lugar contam 1 lugar distinto", () => {
    // my_visited_places já devolve uma linha por lugar; mesmo que viessem duas, o lugar conta uma vez.
    const cities = summarizeCities(
      [
        { id: "santiago", city: juizDeFora },
        { id: "santiago", city: juizDeFora },
      ],
      DEFAULT_CITY_LEVELS,
    );
    expect(cities).toEqual([expect.objectContaining({ id: "jf", places: 1, level: 1 })]);
  });

  it("conta os lugares de cada cidade e ordena da maior para a menor", () => {
    const cities = summarizeCities(
      [
        { id: "a", city: lisboa },
        { id: "b", city: juizDeFora },
        { id: "c", city: juizDeFora },
      ],
      DEFAULT_CITY_LEVELS,
    );
    expect(cities.map(({ id, places, level }) => ({ id, places, level }))).toEqual([
      { id: "jf", places: 2, level: 2 },
      { id: "lisboa", places: 1, level: 1 },
    ]);
  });
});

describe("placesInTab", () => {
  const places = [
    { id: "casa", isResident: true },
    { id: "fora", isResident: false },
  ];

  it("Minha cidade mostra as visitas de quem morava na cidade", () => {
    expect(placesInTab(places, "home").map((place) => place.id)).toEqual(["casa"]);
  });

  it("Viagens mostra as visitas fora da cidade de residência", () => {
    expect(placesInTab(places, "trips").map((place) => place.id)).toEqual(["fora"]);
  });
});
