import { strings } from "../content/pt-BR";

import { isPlaceCategory } from "./categories";

/**
 * O nome da categoria que vier do banco. Lugar sem categoria (como o Santiago
 * Lanches) e categoria sem nome na tela (as sensíveis do grupo
 * other_sensitive, ADR 0010) também ganham um texto.
 */
export function categoryLabel(category: string | null): string {
  if (category === null) return strings.map.noCategory;
  return isPlaceCategory(category) ? strings.categories[category] : strings.map.otherCategory;
}
