/**
 * Categorias de lugar do Lugora: a lista única do app.
 *
 * Cada categoria precisa de um ícone (category-icons.ts) e de um nome
 * (pt-BR.ts); o TypeScript e o teste categories.test.ts acusam se faltar.
 * A correspondência com as categorias do Overture e os grupos da regra D3
 * está no glossário.
 */
export const placeCategories = [
  "cafe",
  "bar",
  "restaurant",
  "bakery",
  "bookstore",
  "ice_cream",
  "pizzeria",
  "burger",
  "brewery",
  "dessert_shop",
  "museum",
  "park",
  "cultural_center",
  "cinema",
] as const;

export type PlaceCategory = (typeof placeCategories)[number];
