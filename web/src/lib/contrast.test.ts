import { describe, expect, it } from "vitest";

import { contrastRatio, relativeLuminance } from "./contrast";

describe("contrastRatio", () => {
  it("dá 21 para preto sobre branco e 1 para a mesma cor", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#1E4FA3", "#1e4fa3")).toBeCloseTo(1, 5);
  });

  it("não depende da ordem das cores", () => {
    expect(contrastRatio("#ffffff", "#767676")).toBeCloseTo(contrastRatio("#767676", "#ffffff"), 10);
  });

  it("bate com um valor conhecido: #767676 sobre branco passa raspando em 4,5:1", () => {
    expect(contrastRatio("#767676", "#ffffff")).toBeCloseTo(4.54, 2);
  });
});

describe("relativeLuminance", () => {
  it("recusa cor fora do formato #rrggbb", () => {
    expect(() => relativeLuminance("azul")).toThrow(/#rrggbb/);
  });
});
