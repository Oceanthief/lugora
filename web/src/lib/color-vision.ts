/**
 * Simulação de daltonismo, para conferir se as faixas do mapa continuam
 * diferentes para quem não distingue certas cores (seção 7.4).
 *
 * Usa as matrizes de Machado, Oliveira e Fernandes (2009), com severidade
 * máxima, aplicadas sobre o RGB linear. A acromatopsia (sem nenhuma cor) vira
 * o cinza de mesma luminância.
 */

export type ColorVision = "protanopia" | "deuteranopia" | "tritanopia" | "achromatopsia";

const MATRICES: Record<Exclude<ColorVision, "achromatopsia">, number[]> = {
  protanopia: [0.152286, 1.052583, -0.204868, 0.114503, 0.786281, 0.099216, -0.003882, -0.048116, 1.051998],
  deuteranopia: [0.367322, 0.860646, -0.227968, 0.280085, 0.672501, 0.047413, -0.01182, 0.04294, 0.968881],
  tritanopia: [1.255528, -0.076749, -0.178779, -0.078411, 0.930809, 0.147602, 0.004733, 0.691367, 0.3039],
};

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toSrgb = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
const clamp = (c: number) => Math.min(1, Math.max(0, c));

function parse(hex: string): [number, number, number] {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!match) throw new Error(`Cor inválida: ${hex} (use #rrggbb).`);
  const value = Number.parseInt(match[1], 16);
  return [value >> 16, (value >> 8) & 0xff, value & 0xff].map((c) => toLinear(c / 255)) as [number, number, number];
}

function format(rgb: number[]): string {
  return `#${rgb
    .map((c) => Math.round(clamp(toSrgb(clamp(c))) * 255).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;
}

/** Como a cor aparece para quem tem o tipo de daltonismo informado. */
export function simulateColorVision(hex: string, vision: ColorVision): string {
  const [r, g, b] = parse(hex);
  if (vision === "achromatopsia") {
    const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return format([y, y, y]);
  }
  const m = MATRICES[vision];
  return format([
    m[0] * r + m[1] * g + m[2] * b,
    m[3] * r + m[4] * g + m[5] * b,
    m[6] * r + m[7] * g + m[8] * b,
  ]);
}
