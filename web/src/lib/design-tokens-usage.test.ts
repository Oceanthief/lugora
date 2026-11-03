import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

/**
 * Critério de aceite da Fatia 1: nenhuma cor fixa fora dos tokens. As cores só
 * existem em design-tokens.ts; o resto do app usa as classes dos tokens
 * (bg-canvas, text-ink...). Testes ficam de fora, porque testam cores
 * conhecidas de propósito.
 */
const SRC = fileURLToPath(new URL("..", import.meta.url));
const ALLOWED = new Set(["lib/design-tokens.ts"]);

const PALETTE =
  "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";
const UTILITY = "bg|text|border|ring|outline|fill|stroke|shadow|divide|placeholder|from|via|to|decoration|caret";

const rules: { name: string; pattern: RegExp }[] = [
  { name: "cor em hexadecimal", pattern: /#[0-9a-f]{3,8}\b/gi },
  { name: "cor em rgb/hsl", pattern: /\b(?:rgba?|hsla?|oklch|oklab)\(/gi },
  { name: "cor da paleta do Tailwind", pattern: new RegExp(`\\b(?:${UTILITY})-(?:${PALETTE})-\\d{2,3}\\b`, "g") },
  { name: "branco ou preto do Tailwind", pattern: new RegExp(`\\b(?:${UTILITY})-(?:white|black)\\b`, "g") },
  { name: "variante dark: (os tokens já trocam com o tema)", pattern: /\bdark:/g },
];

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.(tsx?|css)$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name) ? [path] : [];
  });
}

const violations = (text: string) => rules.filter(({ pattern }) => [...text.matchAll(pattern)].length > 0);

describe("regras de cor solta", () => {
  it("pegam cores fora dos tokens", () => {
    for (const bad of ["text-zinc-600", "bg-[#AC530A]", "color: rgb(0, 0, 0)", "bg-white", "dark:bg-surface"]) {
      expect(violations(bad), bad).not.toHaveLength(0);
    }
  });

  it("deixam passar as classes dos tokens", () => {
    for (const good of ["bg-canvas text-ink", "bg-accent text-on-accent", "border-line", "outline-[var(--map-focus)]"]) {
      expect(violations(good), good).toHaveLength(0);
    }
  });
});

describe("nenhuma cor fixa fora dos tokens", () => {
  const files = sourceFiles(SRC)
    .map((path) => ({ path, name: relative(SRC, path).replaceAll("\\", "/") }))
    .filter(({ name }) => !ALLOWED.has(name));

  it("encontra os arquivos do app", () => {
    expect(files.length).toBeGreaterThan(20);
  });

  for (const { path, name } of files) {
    it(name, () => {
      const problems = readFileSync(path, "utf8")
        .split("\n")
        .flatMap((line, i) =>
          rules.flatMap(({ name: rule, pattern }) =>
            [...line.matchAll(pattern)].map((match) => `linha ${i + 1}: ${rule} (${match[0]})`),
          ),
        );
      expect(problems).toEqual([]);
    });
  }
});
