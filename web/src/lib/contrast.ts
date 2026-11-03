/**
 * Contraste entre duas cores, pela fórmula da WCAG 2.
 *
 * A meta do projeto é 4,5:1 para texto (seção 13). O resultado vai de 1
 * (mesma cor) a 21 (preto sobre branco).
 */

/** Luminância relativa de uma cor "#rrggbb", de 0 (preto) a 1 (branco). */
export function relativeLuminance(hex: string): number {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!match) throw new Error(`Cor inválida: ${hex} (use #rrggbb).`);
  const value = Number.parseInt(match[1], 16);
  const [r, g, b] = [value >> 16, (value >> 8) & 0xff, value & 0xff].map((channel) => {
    const c = channel / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Razão de contraste entre duas cores, como 4.5 para 4,5:1. */
export function contrastRatio(a: string, b: string): number {
  const [lighter, darker] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Meta mínima para texto (WCAG AA, seção 13). */
export const MIN_TEXT_CONTRAST = 4.5;
