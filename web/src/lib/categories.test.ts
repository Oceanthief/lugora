import { describe, expect, it } from "vitest";

import { strings } from "../content/pt-BR";
import { placeCategories } from "./categories";
import { categoryIconPaths } from "./category-icons";

describe("categorias de lugar", () => {
  it("não repete nenhuma categoria", () => {
    expect(new Set(placeCategories).size).toBe(placeCategories.length);
  });

  it("dá um ícone a cada categoria, e só a elas", () => {
    expect(Object.keys(categoryIconPaths).sort()).toEqual([...placeCategories].sort());
    for (const category of placeCategories) {
      const paths = categoryIconPaths[category];
      expect(paths.length, category).toBeGreaterThan(0);
      // Todo traço começa com um "M" (mover até o ponto inicial).
      for (const path of paths) expect(path, category).toMatch(/^M/);
    }
  });

  it("dá um nome em português a cada categoria", () => {
    expect(Object.keys(strings.categories).sort()).toEqual([...placeCategories].sort());
  });
});
