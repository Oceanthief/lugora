import { describe, expect, it } from "vitest";

import { placeCategories } from "../src/lib/categories";
import { parseCsv, rowToPlace, SEED_CATEGORIES, upsertPlaces } from "./seed-lugares.mjs";

const header = "id_overture,nome,categoria_app,endereco,cep,cidade,uf,pais,lat,lng,confianca";
const row = (overrides = {}) => ({
  id_overture: "abc-123",
  nome: "Cervejaria Württemberg",
  categoria_app: "Cervejaria",
  endereco: "R. Dias de Gouvêia, 106",
  cep: "36010-000",
  cidade: "Juiz de Fora",
  uf: "MG",
  pais: "Brasil",
  lat: "-21.76",
  lng: "-43.35",
  ...overrides,
});

describe("parseCsv", () => {
  it("lê campos entre aspas com vírgula, acentos e aspas dobradas", () => {
    const text = `﻿${header}\r\nabc,"Bar ""do Zé""",Bar,"R. Halfeld, 10",36010-000,Juiz de Fora,MG,Brasil,-21.7,-43.3,0.9\r\n`;
    expect(parseCsv(text)).toEqual([
      {
        id_overture: "abc",
        nome: 'Bar "do Zé"',
        categoria_app: "Bar",
        endereco: "R. Halfeld, 10",
        cep: "36010-000",
        cidade: "Juiz de Fora",
        uf: "MG",
        pais: "Brasil",
        lat: "-21.7",
        lng: "-43.3",
        confianca: "0.9",
      },
    ]);
  });
});

describe("rowToPlace", () => {
  it("converte a linha num lugar, com [lng, lat] e só os campos do app", () => {
    expect(rowToPlace(row(), 2)).toEqual({
      id: "abc-123",
      gersId: "abc-123",
      name: "Cervejaria Württemberg",
      category: "brewery",
      cityId: "jf",
      location: [-43.35, -21.76],
      address: "R. Dias de Gouvêia, 106",
      postalCode: "36010-000",
    });
  });

  it("recusa categoria que o app não tem", () => {
    expect(() => rowToPlace(row({ categoria_app: "Boate" }), 7)).toThrow(/Linha 7.*Boate/);
  });

  it("recusa coordenada que não é número", () => {
    expect(() => rowToPlace(row({ lat: "" }), 3)).toThrow(/coordenadas inválidas/);
  });

  it("recusa cidade que o app não conhece", () => {
    expect(() => rowToPlace(row({ cidade: "Lisboa", uf: "", pais: "Portugal" }), 4)).toThrow(/Lisboa/);
  });

  it("sem id_overture, cria um id estável a partir de nome e coordenadas", () => {
    const a = rowToPlace(row({ id_overture: "" }), 2);
    const b = rowToPlace(row({ id_overture: "", nome: "CERVEJARIA WURTTEMBERG" }), 2);
    expect(a.id).toMatch(/^seed-/);
    expect(a.gersId).toBeUndefined();
    expect(b.id).toBe(a.id);
  });
});

describe("upsertPlaces", () => {
  const incoming = [rowToPlace(row(), 2), rowToPlace(row({ id_overture: "def-456", nome: "Bar Dias", categoria_app: "Bar" }), 3)];

  it("rodar duas vezes não duplica nada", () => {
    const first = upsertPlaces([], incoming);
    const second = upsertPlaces(first.places, incoming);

    expect(first.summary).toMatchObject({ inserted: 2, updated: 0, unchanged: 0 });
    expect(second.summary).toMatchObject({ inserted: 0, updated: 0, unchanged: 2 });
    expect(second.places).toEqual(first.places);
  });

  it("atualiza o lugar que mudou no CSV, pela mesma chave", () => {
    const { places } = upsertPlaces([], incoming);
    const renamed = [rowToPlace(row({ nome: "Württemberg" }), 2)];
    const result = upsertPlaces(places, renamed);

    expect(result.summary).toMatchObject({ inserted: 0, updated: 1, keptFromBefore: 1 });
    expect(result.places).toHaveLength(2);
  });

  it("recusa lugar repetido no próprio CSV", () => {
    expect(() => upsertPlaces([], [incoming[0], incoming[0]])).toThrow(/repetido/);
  });
});

describe("SEED_CATEGORIES", () => {
  it("só aponta para categorias que existem no app", () => {
    for (const category of Object.values(SEED_CATEGORIES)) {
      expect(placeCategories).toContain(category);
    }
  });
});
