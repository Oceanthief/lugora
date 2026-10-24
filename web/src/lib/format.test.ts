import { describe, expect, it } from "vitest";

import { formatRating } from "./format";

describe("formatRating", () => {
  it("usa vírgula como separador decimal", () => {
    expect(formatRating(4.5)).toBe("4,5");
  });

  it("mostra sempre uma casa decimal", () => {
    expect(formatRating(5)).toBe("5,0");
  });

  it("formata a menor nota possível", () => {
    expect(formatRating(0.5)).toBe("0,5");
  });
});
