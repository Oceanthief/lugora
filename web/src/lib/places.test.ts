import { describe, expect, it } from "vitest";

import { isPlaceCategory } from "./categories";
import { formatDistance } from "./format";
import { isSelectablePlace, isValidPosition, toPlaceResult } from "./places";

describe("resultado da busca", () => {
  it("traduz a linha do banco e mantém os campos vazios", () => {
    expect(
      toPlaceResult({
        id: "1",
        name: "Santiago Lanches",
        address: null,
        category: null,
        is_visitable: true,
        is_sensitive: false,
        distance_meters: null,
      }),
    ).toEqual({
      id: "1",
      name: "Santiago Lanches",
      address: null,
      category: null,
      isVisitable: true,
      isSensitive: false,
      distanceMeters: null,
    });
  });
});

describe("o que dá para escolher", () => {
  it("não deixa escolher um condomínio", () => {
    expect(isSelectablePlace({ category: "residential" })).toBe(false);
  });

  it("deixa escolher um lugar sem categoria, como o Santiago Lanches", () => {
    expect(isSelectablePlace({ category: null })).toBe(true);
  });

  it("deixa escolher um lugar sensível: a visita nasce só eu (Fatia 4)", () => {
    expect(isSelectablePlace({ category: "hospital" })).toBe(true);
  });
});

describe("posição", () => {
  it("aceita uma posição real", () => {
    expect(isValidPosition({ latitude: -21.76, longitude: -43.35 })).toBe(true);
  });

  it.each([
    { latitude: 91, longitude: 0 },
    { latitude: 0, longitude: 181 },
    { latitude: Number.NaN, longitude: 0 },
    { latitude: 0, longitude: Number.POSITIVE_INFINITY },
  ])("recusa %j", (position) => {
    expect(isValidPosition(position)).toBe(false);
  });
});

describe("distância", () => {
  it.each([
    [0, "10 m"],
    [4, "10 m"],
    [507, "510 m"],
    [994, "990 m"],
    [1000, "1 km"],
    [1077, "1,1 km"],
    [1674, "1,7 km"],
    [9940, "9,9 km"],
    [12400, "12 km"],
  ])("%d metros viram %s", (meters, expected) => {
    expect(formatDistance(meters)).toBe(expected);
  });
});

describe("categoria vinda do banco", () => {
  it("reconhece as categorias conhecidas", () => {
    expect(isPlaceCategory("restaurant")).toBe(true);
    expect(isPlaceCategory("residential")).toBe(true);
  });

  it("não reconhece o que não está na lista", () => {
    expect(isPlaceCategory(null)).toBe(false);
    expect(isPlaceCategory("attorney_or_law_firm")).toBe(false);
  });
});
