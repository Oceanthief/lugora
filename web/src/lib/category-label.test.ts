import { describe, expect, it } from "vitest";

import { categoryLabel } from "./category-label";
import { iconPathsFor, otherCategoryIconPaths } from "./category-icons";

describe("categoria vinda do banco, no mapa", () => {
  it("usa o nome da categoria conhecida", () => {
    expect(categoryLabel("restaurant")).toBe("Restaurante");
    expect(iconPathsFor("restaurant")).not.toBe(otherCategoryIconPaths);
  });

  it("lugar sem categoria, como o Santiago Lanches, tem nome e ícone", () => {
    expect(categoryLabel(null)).toBe("Sem categoria");
    expect(iconPathsFor(null)).toBe(otherCategoryIconPaths);
  });

  it("categoria sensível sem nome na tela não quebra o mapa", () => {
    expect(categoryLabel("labor_union")).toBe("Outro tipo de lugar");
    expect(iconPathsFor("labor_union")).toBe(otherCategoryIconPaths);
  });
});
