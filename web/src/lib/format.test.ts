import { describe, expect, it } from "vitest";

import { formatRating, formatVisitDate } from "./format";

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

describe("formatVisitDate", () => {
  it("usa o formato brasileiro", () => {
    expect(formatVisitDate("2026-10-23")).toBe("23/10/2026");
  });

  it("mantém os zeros à esquerda", () => {
    expect(formatVisitDate("2026-01-05")).toBe("05/01/2026");
  });
});
