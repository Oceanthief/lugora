import type { PlaceCategory } from "./categories";

/**
 * Ícones das categorias: o único lugar que liga categoria a ícone. Cada um é
 * uma lista de caminhos SVG numa grade de 24 × 24, desenhados só com traço.
 * O mesmo desenho serve para o mapa (pintado num canvas, em visit-map.tsx) e
 * para as listas (SVG, em category-icon.tsx). Provisórios até a identidade
 * visual da Fatia 1.
 *
 * A categoria é diferenciada pela forma, não pela cor: as cores do mapa são
 * da escala de lugares distintos (seção 7.4) e precisam funcionar para quem
 * não distingue cores.
 */
const museumIcon = ["M3 9 12 4l9 5H3Z", "M5.5 12v6M10 12v6M14 12v6M18.5 12v6", "M3.5 20.5h17"];
const parkIcon = ["M12 3 6 11h3l-4 6h14l-4-6h3L12 3Z", "M12 17v4"];
const dropIcon = ["M12 3c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11Z"];
const dumbbellIcon = ["M4 9v6", "M7 7v10", "M17 7v10", "M20 9v6", "M7 12h10"];
const bagIcon = ["M6 8h12l1 12H5L6 8Z", "M9 8V6a3 3 0 0 1 6 0v2"];
const bedIcon = ["M3 18v-7", "M3 14h18v4", "M21 14v-1a3 3 0 0 0-3-3h-7v4", "M6.5 11.5h.01"];
const templeIcon = ["M12 3v4", "M10 5h4", "M5 21V11l7-4 7 4v10", "M10 21v-5h4v5"];
const healthIcon = ["M9.5 4h5v5.5H20v5h-5.5V20h-5v-5.5H4v-5h5.5V4Z"];
const bookIcon = ["M5 5a2 2 0 0 1 2-2h12v15H7a2 2 0 0 0-2 2V5Z", "M5 20a2 2 0 0 0 2 1h12"];
const maskIcon = ["M5 4h14v7a7 7 0 0 1-14 0V4Z", "M9 8.5h.01M15 8.5h.01", "M9 13.5a3.5 3.5 0 0 0 6 0"];

export const categoryIconPaths: Record<PlaceCategory, readonly string[]> = {
  // Xícara com vapor
  cafe: [
    "M5 9h11v4a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5V9Z",
    "M16 10h1.5a2.5 2.5 0 0 1 0 5H16",
    "M9 3.5v2.5M12.5 3.5v2.5",
  ],
  // Taça de drinque
  bar: ["M5 4h14l-7 8-7-8Z", "M12 12v8", "M8 20h8"],
  // Garfo e faca
  restaurant: [
    "M6 3v6a2 2 0 0 0 4 0V3",
    "M8 11v10",
    "M17 3c-2.5 2-2.5 7 0 9v9",
  ],
  // Pão
  bakery: ["M4 12a8 5 0 0 1 16 0v7H4v-7Z", "M9 9.5 8 12M13 9l-1 3"],
  // Livro
  bookstore: [
    "M5 5a2 2 0 0 1 2-2h12v15H7a2 2 0 0 0-2 2V5Z",
    "M5 20a2 2 0 0 0 2 1h12",
  ],
  // Casquinha
  ice_cream: ["M7 10a5 5 0 1 1 10 0H7Z", "M8 10l4 11 4-11"],
  // Fatia de pizza inclinada, para não lembrar a casquinha
  pizzeria: [
    "M4 20 7.5 5.5a15 15 0 0 1 11 11L4 20Z",
    "M9.5 11h.01M12.5 14.5h.01M8.5 15.5h.01",
  ],
  // Hambúrguer: pão de cima, recheio e pão de baixo
  burger: [
    "M4 11a8 6.5 0 0 1 16 0H4Z",
    "M3 14.5h18",
    "M5 18h14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2Z",
  ],
  // Caneca de chope com espuma
  brewery: [
    "M4.5 7.5a2.5 2.5 0 0 1 3-3 3 3 0 0 1 5 0 2.5 2.5 0 0 1 3 3Z",
    "M5 7.5V19a1.5 1.5 0 0 0 1.5 1.5h7A1.5 1.5 0 0 0 15 19V7.5",
    "M15 10h1.5a2 2 0 0 1 2 2v2.5a2 2 0 0 1-2 2H15",
    "M8.5 11v6M11.5 11v6",
  ],
  // Bala embrulhada
  dessert_shop: [
    "M8.5 12a3.5 3.5 0 1 0 7 0 3.5 3.5 0 1 0-7 0",
    "M8.7 10.8 4 8v8l4.7-2.8",
    "M15.3 10.8 20 8v8l-4.7-2.8",
  ],
  // Prédio com frontão e colunas
  museum: [
    "M3 9 12 4l9 5H3Z",
    "M5.5 12v6M10 12v6M14 12v6M18.5 12v6",
    "M3.5 20.5h17",
  ],
  // Árvore
  park: ["M12 3 6 11h3l-4 6h14l-4-6h3L12 3Z", "M12 17v4"],
  // Máscara de teatro
  cultural_center: [
    "M5 4h14v7a7 7 0 0 1-14 0V4Z",
    "M9 8.5h.01M15 8.5h.01",
    "M9 13.5a3.5 3.5 0 0 0 6 0",
  ],
  // Claquete
  cinema: [
    "M4 7h16v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7Z",
    "M4 11h16",
    "M9 7l-2 4M14 7l-2 4M19 7l-2 4",
  ],
  // As categorias abaixo vieram com a base de lugares (Fatia 3) e aparecem na
  // busca. Parecidas dividem o mesmo ícone: o nome delas aparece em texto ao lado.
  casual_eatery: ["M6 3v6a2 2 0 0 0 4 0V3", "M8 11v10", "M17 3c-2.5 2-2.5 7 0 9v9"],
  fast_food: ["M4 11a8 6.5 0 0 1 16 0H4Z", "M3 14.5h18", "M5 18h14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2Z"],
  // Copo com canudo
  juice_bar: ["M7 8h10l-1 13H8L7 8Z", "M13 8l2-5h3"],
  // Quadro com uma paisagem
  art_gallery: ["M4 5h16v14H4V5Z", "M4 15l5-4 4 3 3-2 4 3"],
  library: bookIcon,
  theater: maskIcon,
  // Obelisco
  monument: ["M10 21V8l2-5 2 5v13", "M6 21h12"],
  historic_site: museumIcon,
  plaza: parkIcon,
  garden: parkIcon,
  nature_reserve: parkIcon,
  waterfall: dropIcon,
  lake: dropIcon,
  zoo: parkIcon,
  skate_park: parkIcon,
  dog_park: parkIcon,
  // Arquibancada vista de cima
  stadium: ["M12 6c5 0 9 2.7 9 6s-4 6-9 6-9-2.7-9-6 4-6 9-6Z", "M12 6v12"],
  gym: dumbbellIcon,
  fitness_studio: dumbbellIcon,
  sports_facility: dumbbellIcon,
  // Ondas
  swimming_pool: ["M3 10c2-2 4-2 6 0s4 2 6 0 4-2 6 0", "M3 16c2-2 4-2 6 0s4 2 6 0 4-2 6 0"],
  shopping_mall: bagIcon,
  craft_store: bagIcon,
  amusement_park: parkIcon,
  hotel: bedIcon,
  lodging: bedIcon,
  place_of_worship: templeIcon,
  religious_organization: templeIcon,
  hospital: healthIcon,
  dental_clinic: healthIcon,
  health_care: healthIcon,
  // Casa
  residential: ["M4 11.5 12 5l8 6.5", "M6 10v10h12V10", "M10 20v-5h4v5"],
};
