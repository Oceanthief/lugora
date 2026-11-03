/**
 * Tokens de design do Lugora (direção C, "Luz de poste"): a fonte única das
 * cores do app. Documentação de cada um em docs/design/identidade.md.
 *
 * Daqui saem as variáveis CSS (tokensCss, injetado no layout), que o
 * Tailwind usa nas classes (globals.css); o mapa e os testes de contraste
 * leem os valores direto deste arquivo. Mudou uma cor? Mude só aqui.
 */

export type ColorToken =
  | "canvas"
  | "surface"
  | "ink"
  | "ink-muted"
  | "accent"
  | "on-accent"
  | "glow"
  | "on-glow"
  | "line"
  | "danger"
  | "level-1"
  | "level-2"
  | "level-3"
  | "level-4";

export type Theme = "light" | "dark";

/** Cores de cada tema. */
export const colors: Record<Theme, Record<ColorToken, string>> = {
  light: {
    canvas: "#F4F5F8",
    surface: "#FFFFFF",
    ink: "#19212E",
    "ink-muted": "#4E5767",
    accent: "#AC530A",
    "on-accent": "#FFFFFF",
    glow: "#FBE7C8",
    "on-glow": "#19212E",
    line: "#DCE0E7",
    danger: "#B42318",
    "level-1": "#F8E1B5",
    "level-2": "#E8A647",
    "level-3": "#C8771E",
    "level-4": "#7A4310",
  },
  dark: {
    canvas: "#131A25",
    surface: "#1C2635",
    ink: "#F3EEE6",
    "ink-muted": "#AEB6C4",
    accent: "#F2A93B",
    "on-accent": "#1A1206",
    glow: "#3A2E1C",
    "on-glow": "#F6D9A8",
    line: "#2B3647",
    danger: "#FF8A7A",
    "level-1": "#4A3518",
    "level-2": "#8A5A1C",
    "level-3": "#D08A2C",
    "level-4": "#F7C46A",
  },
};

/**
 * Cores dos pontos no mapa. Não mudam com o tema do app, porque o mapa base
 * (OpenFreeMap Liberty) é sempre claro: o texto escuro do tema claro é o que
 * se lê sobre ele.
 */
export const mapColors = {
  pointFill: colors.light.accent,
  pointStroke: "#FFFFFF",
  pointIcon: "#FFFFFF",
  labelText: colors.light.ink,
  labelHalo: "#FFFFFF",
  /** Contorno do ponto em foco pelo teclado, legível sobre o mapa claro. */
  focus: colors.light.ink,
};

/** Prefixo das variáveis CSS geradas a partir dos tokens. */
const PREFIX = "--lugora-";

function declarations(theme: Theme): string {
  const vars = Object.entries(colors[theme]).map(([token, value]) => `${PREFIX}${token}:${value}`);
  return [...vars, `color-scheme:${theme}`].join(";");
}

/**
 * CSS das variáveis de cor: o tema claro por padrão, o escuro quando o
 * aparelho pede, e `data-theme` para forçar um tema num trecho da página
 * (como as prévias em /estilos).
 */
export function tokensCss(): string {
  const light = declarations("light");
  const dark = declarations("dark");
  return [
    `:root,[data-theme="light"]{${light}}`,
    `@media (prefers-color-scheme:dark){:root{${dark}}}`,
    `[data-theme="dark"]{${dark}}`,
  ].join("");
}
