import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { simulateColorVision, type ColorVision } from "./color-vision";
import { contrastRatio, MIN_TEXT_CONTRAST } from "./contrast";
import { colors, mapColors, tokensCss, type ColorToken, type Theme } from "./design-tokens";

const themes: Theme[] = ["light", "dark"];

/** Pares de texto sobre fundo que aparecem no app. */
const textPairs: [ColorToken, ColorToken][] = [
  ["ink", "canvas"],
  ["ink", "surface"],
  ["ink-muted", "canvas"],
  ["ink-muted", "surface"],
  ["on-accent", "accent"],
  ["on-glow", "glow"],
  ["accent", "canvas"],
  ["accent", "surface"],
  ["danger", "canvas"],
  ["danger", "surface"],
];

/** Diferença mínima entre faixas vizinhas do mapa (razão de contraste). */
const MIN_LEVEL_STEP = 1.5;
const visions: (ColorVision | "normal")[] = ["normal", "protanopia", "deuteranopia", "tritanopia", "achromatopsia"];

describe("contraste dos tokens (seção 13: texto com pelo menos 4,5:1)", () => {
  for (const theme of themes) {
    for (const [fg, bg] of textPairs) {
      it(`${theme}: ${fg} sobre ${bg}`, () => {
        expect(contrastRatio(colors[theme][fg], colors[theme][bg])).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
      });
    }
  }

  it("mapa: a nota embaixo do ponto se lê sobre o contorno claro", () => {
    expect(contrastRatio(mapColors.labelText, mapColors.labelHalo)).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
  });

  it("mapa: o ícone se destaca do ponto (3:1, elemento gráfico)", () => {
    expect(contrastRatio(mapColors.pointIcon, mapColors.pointFill)).toBeGreaterThanOrEqual(3);
  });

  it("mapa: o número de lugares se lê dentro do círculo de cada faixa", () => {
    mapColors.levels.forEach((level, index) => {
      expect(contrastRatio(mapColors.levelText[index], level), `faixa ${index + 1}`).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
    });
  });

  it("mapa: o contorno do círculo se destaca da faixa mais clara (3:1, elemento gráfico)", () => {
    expect(contrastRatio(mapColors.levelStroke, mapColors.levels[0])).toBeGreaterThanOrEqual(3);
  });
});

describe("faixas do mapa (seção 7.4: sequenciais e seguras para daltônicos)", () => {
  for (const theme of themes) {
    const levels = (["level-1", "level-2", "level-3", "level-4"] as const).map((token) => colors[theme][token]);

    for (const vision of visions) {
      it(`${theme}, visão ${vision}: cada faixa difere da vizinha`, () => {
        const seen = vision === "normal" ? levels : levels.map((level) => simulateColorVision(level, vision));
        for (let i = 1; i < seen.length; i++) {
          expect(contrastRatio(seen[i], seen[i - 1]), `faixa ${i} → ${i + 1}`).toBeGreaterThanOrEqual(MIN_LEVEL_STEP);
        }
      });
    }

    it(`${theme}: a luminosidade muda sempre no mesmo sentido`, () => {
      const steps = levels.slice(1).map((level, i) => contrastRatio(level, colors[theme].canvas) - contrastRatio(levels[i], colors[theme].canvas));
      // No claro, cada faixa contrasta mais com o fundo claro; no escuro, também (mais clara sobre fundo escuro).
      expect(steps.every((step) => step > 0)).toBe(true);
    });
  }
});

describe("tokensCss", () => {
  const css = tokensCss();

  it("declara todos os tokens nos dois temas", () => {
    for (const theme of themes) {
      for (const [token, value] of Object.entries(colors[theme])) {
        expect(css).toContain(`--lugora-${token}:${value}`);
      }
    }
  });

  it("deixa forçar um tema com data-theme e segue o aparelho por padrão", () => {
    expect(css).toContain('[data-theme="dark"]');
    expect(css).toContain('[data-theme="light"]');
    expect(css).toContain("@media (prefers-color-scheme:dark)");
  });

  it("todo token vira classe do Tailwind em globals.css", () => {
    const globals = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
    for (const token of Object.keys(colors.light)) {
      expect(globals, token).toContain(`--color-${token}: var(--lugora-${token})`);
    }
  });
});
