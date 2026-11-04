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
  "casual_eatery",
  "fast_food",
  "juice_bar",
  "art_gallery",
  "library",
  "theater",
  "monument",
  "historic_site",
  "plaza",
  "garden",
  "nature_reserve",
  "waterfall",
  "lake",
  "zoo",
  "skate_park",
  "dog_park",
  "stadium",
  "gym",
  "fitness_studio",
  "sports_facility",
  "swimming_pool",
  "shopping_mall",
  "craft_store",
  "amusement_park",
  "hotel",
  "lodging",
  "place_of_worship",
  "religious_organization",
  "hospital",
  "dental_clinic",
  "health_care",
  "residential",
] as const;

export type PlaceCategory = (typeof placeCategories)[number];

/** A categoria vem do banco como texto: só as conhecidas ganham ícone e nome. */
export function isPlaceCategory(value: string | null): value is PlaceCategory {
  return (placeCategories as readonly (string | null)[]).includes(value);
}
