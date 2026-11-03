/**
 * As três direções visuais da Fatia 1, para comparar em /estilos.
 *
 * Página e textos temporários: saem do app quando uma direção for escolhida
 * e virar tokens no tema do Tailwind (Fatia 1, entrega 4).
 */

export type ThemeColors = {
  /** Fundo da tela. */
  canvas: string;
  /** Fundo de cartões e barras. */
  surface: string;
  /** Texto principal. */
  text: string;
  /** Texto secundário. */
  muted: string;
  /** Cor de destaque (botão principal, aba ativa). */
  accent: string;
  /** Texto sobre a cor de destaque. */
  onAccent: string;
  /** Destaque suave (ocasião escolhida). */
  soft: string;
  /** Texto sobre o destaque suave. */
  onSoft: string;
  /** Linhas e contornos. */
  border: string;
  /**
   * As 4 faixas do mapa (seção 7.4: 1, 2 a 5, 6 a 15, 16 ou mais lugares).
   * No claro, mais lugares = mais escuro; no escuro, mais lugares = mais claro.
   */
  levels: [string, string, string, string];
};

export type Direction = {
  id: "a" | "b" | "c" | "d";
  name: string;
  /** Quando a direção é uma mistura de outras, de quais. */
  mixOf?: string;
  idea: string;
  forWhom: string;
  risk: string;
  /** Nomes das fontes, para mostrar na página. */
  typefaces: string;
  /** Nomes das cores principais de cada tema, na ordem canvas, surface, text, accent, soft. */
  colorNames: Record<"light" | "dark", [string, string, string, string, string]>;
  /** Raio dos cartões e dos controles. */
  radius: { card: string; control: string };
  /** Estilo da barra inferior. */
  nav: "bar" | "minimal" | "floating" | "mixed";
  light: ThemeColors;
  dark: ThemeColors;
};

export const directions: readonly Direction[] = [
  {
    id: "d",
    name: "Placa no caderno",
    mixOf: "Mistura de A e B, avaliada na Entrega 2",
    idea: "O nome do lugar continua como placa de rua azul, mas sobre uma página branca e leve, com a nota em número grande e o verde da mata marcando o que você já viveu.",
    forWhom: "Quem anda pela cidade e também quer guardar a memória dos lugares, sem tela cheia de informação.",
    risk: "Duas cores de destaque pedem uma regra clara: azul para ações, verde para o que você já visitou.",
    typefaces: "Overpass em todos os textos; Newsreader (serifada) só no número da nota",
    colorNames: {
      light: ["Papel", "Concreto", "Azul-noite", "Azul placa", "Broto"],
      dark: ["Azul-noite", "Asfalto", "Branco placa", "Azul claro", "Musgo"],
    },
    radius: { card: "16px", control: "999px" },
    nav: "mixed",
    light: {
      canvas: "#FFFFFF",
      surface: "#F2F5F8",
      text: "#13203A",
      muted: "#4A5874",
      accent: "#1E4FA3",
      onAccent: "#FFFFFF",
      soft: "#D8EADF",
      onSoft: "#13203A",
      border: "#DCE3EA",
      levels: ["#D5EADB", "#9DCBAC", "#579B73", "#2E6A4E"],
    },
    dark: {
      canvas: "#0E1A2F",
      surface: "#172741",
      text: "#EEF2F8",
      muted: "#AAB7CC",
      accent: "#7FA7EF",
      onAccent: "#0E1A2F",
      soft: "#24392D",
      onSoft: "#E7EEE9",
      border: "#2A3B58",
      levels: ["#1F3A2B", "#2F6B4E", "#5EAE81", "#A8DDBB"],
    },
  },
  {
    id: "a",
    name: "Placa de rua",
    idea: "O app fala a língua da rua: o nome do lugar aparece como uma placa azul e branca, e o amarelo das faixas marca o que você escolheu.",
    forWhom: "Quem anda pela cidade e quer achar rápido onde já foi e o que falta conhecer.",
    risk: "Pode lembrar sinalização oficial e ficar fria; o amarelo precisa de dose certa para não cansar.",
    typefaces: "Overpass (inspirada nas placas de estrada), em todos os textos",
    colorNames: {
      light: ["Concreto", "Branco", "Azul-noite", "Azul placa", "Amarelo faixa"],
      dark: ["Azul-noite", "Asfalto", "Branco placa", "Azul claro", "Amarelo faixa"],
    },
    radius: { card: "10px", control: "8px" },
    nav: "bar",
    light: {
      canvas: "#F1F4F8",
      surface: "#FFFFFF",
      text: "#13203A",
      muted: "#4A5874",
      accent: "#1E4FA3",
      onAccent: "#FFFFFF",
      soft: "#F6CB3F",
      onSoft: "#13203A",
      border: "#D3DBE6",
      levels: ["#C8D7F0", "#8EAFE2", "#4C7ECA", "#1E4FA3"],
    },
    dark: {
      canvas: "#0E1A2F",
      surface: "#172741",
      text: "#EEF2F8",
      muted: "#AAB7CC",
      accent: "#7FA7EF",
      onAccent: "#0E1A2F",
      soft: "#F6CB3F",
      onSoft: "#13203A",
      border: "#2A3B58",
      levels: ["#25406B", "#2F5FA6", "#5E90DF", "#AAC6F4"],
    },
  },
  {
    id: "b",
    name: "Caderno de bairro",
    idea: "Cada visita é uma anotação num caderno: o nome do lugar em letra de livro, a nota em número grande, muito espaço em branco e o verde das árvores da cidade.",
    forWhom: "Quem usa o Lugora como diário e gosta de reler os lugares por onde passou.",
    risk: "Pode parecer calmo demais para um app de rua; a fonte serifada pede cuidado em tamanhos pequenos.",
    typefaces: "Newsreader (serifada) nos nomes e notas; Hanken Grotesk no resto",
    colorNames: {
      light: ["Papel", "Folha", "Tinta", "Verde-mata", "Broto"],
      dark: ["Mata à noite", "Folha escura", "Papel", "Verde claro", "Musgo"],
    },
    radius: { card: "20px", control: "999px" },
    nav: "minimal",
    light: {
      canvas: "#FFFFFF",
      surface: "#F2F5F2",
      text: "#1D2A23",
      muted: "#55635A",
      accent: "#2E6A4E",
      onAccent: "#FFFFFF",
      soft: "#D8EADF",
      onSoft: "#1D2A23",
      border: "#DFE5E0",
      levels: ["#D5EADB", "#9DCBAC", "#579B73", "#2E6A4E"],
    },
    dark: {
      canvas: "#0F1914",
      surface: "#17241D",
      text: "#E7EEE9",
      muted: "#A3B3A9",
      accent: "#7CC39A",
      onAccent: "#0F1914",
      soft: "#24392D",
      onSoft: "#E7EEE9",
      border: "#263A2F",
      levels: ["#1F3A2B", "#2F6B4E", "#5EAE81", "#A8DDBB"],
    },
  },
  {
    id: "c",
    name: "Luz de poste",
    idea: "A cidade depois das seis: fundo azul-noite, a luz âmbar dos postes nos lugares visitados e uma barra que flutua sobre o mapa.",
    forWhom: "Quem sai à noite: bares, cervejarias, shows e o Cine-Theatro.",
    risk: "É a menos leve das três; de dia, no tema claro, o âmbar perde força e precisa escurecer.",
    typefaces: "Urbanist, geométrica, em todos os textos",
    colorNames: {
      light: ["Neblina", "Calçada", "Asfalto", "Âmbar queimado", "Brilho"],
      dark: ["Asfalto", "Calçada à noite", "Branco quente", "Âmbar", "Brilho"],
    },
    radius: { card: "24px", control: "999px" },
    nav: "floating",
    light: {
      canvas: "#F4F5F8",
      surface: "#FFFFFF",
      text: "#19212E",
      muted: "#4E5767",
      accent: "#AC530A",
      onAccent: "#FFFFFF",
      soft: "#FBE7C8",
      onSoft: "#19212E",
      border: "#DCE0E7",
      levels: ["#F8E1B5", "#E8A647", "#C8771E", "#7A4310"],
    },
    dark: {
      canvas: "#131A25",
      surface: "#1C2635",
      text: "#F3EEE6",
      muted: "#AEB6C4",
      accent: "#F2A93B",
      onAccent: "#1A1206",
      soft: "#3A2E1C",
      onSoft: "#F6D9A8",
      border: "#2B3647",
      levels: ["#4A3518", "#8A5A1C", "#D08A2C", "#F7C46A"],
    },
  },
];

/** Os pares de cor que levam texto, para a tabela de contraste. */
export function textPairs(colors: ThemeColors): { label: string; fg: string; bg: string }[] {
  return [
    { label: "Texto principal no fundo", fg: colors.text, bg: colors.canvas },
    { label: "Texto secundário no fundo", fg: colors.muted, bg: colors.canvas },
    { label: "Texto principal no cartão", fg: colors.text, bg: colors.surface },
    { label: "Texto secundário no cartão", fg: colors.muted, bg: colors.surface },
    { label: "Botão principal", fg: colors.onAccent, bg: colors.accent },
    { label: "Ocasião escolhida", fg: colors.onSoft, bg: colors.soft },
    { label: "Destaque como texto no cartão", fg: colors.accent, bg: colors.surface },
  ];
}
