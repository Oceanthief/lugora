import { describe, expect, it } from "vitest";

import {
  formatCountryName,
  formatRating,
  formatSourceHost,
  formatVisitDate,
  toISODate,
  toSaoPauloDate,
} from "./format";

describe("toSaoPauloDate", () => {
  it("usa o dia de Brasília, não o de UTC", () => {
    // 01h30 em UTC ainda é dia 5 em Brasília (UTC-3).
    expect(toSaoPauloDate("2026-11-06T01:30:00Z")).toBe("2026-11-05");
    expect(toSaoPauloDate("2026-11-06T03:00:00Z")).toBe("2026-11-06");
  });

  it("aceita o formato que a API do banco devolve", () => {
    expect(toSaoPauloDate("2026-11-09T14:22:31.123456+00:00")).toBe("2026-11-09");
  });
});

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

describe("toISODate", () => {
  it("usa o dia do aparelho, mesmo tarde da noite", () => {
    // 28/10/2026 às 23h30 no horário local (o mês começa em 0 no Date).
    expect(toISODate(new Date(2026, 9, 28, 23, 30))).toBe("2026-10-28");
  });

  it("mantém os zeros à esquerda", () => {
    expect(toISODate(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

describe("formatCountryName", () => {
  it("dá o nome do país em português", () => {
    expect(formatCountryName("BR")).toBe("Brasil");
    expect(formatCountryName("PT")).toBe("Portugal");
  });
});

describe("formatSourceHost", () => {
  it("mostra só o site, sem www", () => {
    expect(formatSourceHost("https://www.instagram.com/p/abc/")).toBe("instagram.com");
  });

  it("devolve o texto como veio se não for um link", () => {
    expect(formatSourceHost("vi num cartaz")).toBe("vi num cartaz");
  });
});
