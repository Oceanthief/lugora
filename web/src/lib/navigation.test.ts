import { describe, expect, it } from "vitest";

import { isActivePath, navItems } from "./navigation";

describe("isActivePath", () => {
  it("ativa a aba da rota atual", () => {
    expect(isActivePath("/mapa", "/mapa")).toBe(true);
  });

  it("ativa a aba nas rotas filhas", () => {
    expect(isActivePath("/perfil/victor", "/perfil")).toBe(true);
  });

  it("não ativa abas de outras rotas", () => {
    expect(isActivePath("/mapa", "/feed")).toBe(false);
  });

  it("não ativa a aba só porque o começo do texto é igual", () => {
    expect(isActivePath("/perfilx", "/perfil")).toBe(false);
  });
});

describe("navItems", () => {
  it("tem as 5 abas na ordem da barra inferior", () => {
    expect(navItems.map((item) => item.href)).toEqual([
      "/mapa",
      "/feed",
      "/registrar",
      "/quero-ir",
      "/perfil",
    ]);
  });

  it("destaca só o Registrar", () => {
    const highlighted = navItems.filter((item) => item.highlight);
    expect(highlighted.map((item) => item.href)).toEqual(["/registrar"]);
  });
});
