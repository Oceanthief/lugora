import type { PlaceCategory } from "./mock-data";

/**
 * Ícones das categorias, como caminhos SVG numa grade de 24 × 24, desenhados
 * só com traço. O mesmo desenho serve para o mapa (pintado num canvas) e para
 * as listas (SVG). Provisórios até a identidade visual da Fatia 1.
 *
 * A categoria é diferenciada pela forma, não pela cor: as cores do mapa são
 * da escala de lugares distintos (seção 7.4) e precisam funcionar para quem
 * não distingue cores.
 */
export const categoryIconPaths: Record<PlaceCategory, readonly string[]> = {
  cafe: [
    "M5 9h11v4a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5V9Z",
    "M16 10h1.5a2.5 2.5 0 0 1 0 5H16",
    "M9 3.5v2.5M12.5 3.5v2.5",
  ],
  bar: ["M5 4h14l-7 8-7-8Z", "M12 12v8", "M8 20h8"],
  restaurant: [
    "M6 3v6a2 2 0 0 0 4 0V3",
    "M8 11v10",
    "M17 3c-2.5 2-2.5 7 0 9v9",
  ],
  bakery: ["M4 12a8 5 0 0 1 16 0v7H4v-7Z", "M9 9.5 8 12M13 9l-1 3"],
  bookstore: [
    "M5 5a2 2 0 0 1 2-2h12v15H7a2 2 0 0 0-2 2V5Z",
    "M5 20a2 2 0 0 0 2 1h12",
  ],
  ice_cream: ["M7 10a5 5 0 1 1 10 0H7Z", "M8 10l4 11 4-11"],
};
