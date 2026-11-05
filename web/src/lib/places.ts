/** A busca de lugares em Registrar, sem rede nem banco: coberta por places.test.ts. */

export const PLACE_SEARCH_MIN_LENGTH = 2;

/** Mesmo valor da limpeza em pipelines/overture/importar_lugares.py (D3). */
const RESIDENTIAL_CATEGORY = "residential";

export type PlaceResult = {
  id: string;
  name: string;
  address: string | null;
  category: string | null;
  isVisitable: boolean;
  distanceMeters: number | null;
};

export type Position = {
  latitude: number;
  longitude: number;
};

/**
 * Os tipos gerados pelo Supabase não enxergam os nulos de uma função que
 * devolve uma tabela: endereço, categoria e distância podem vir vazios.
 */
export function toPlaceResult(row: {
  id: string;
  name: string;
  address: string | null;
  category: string | null;
  is_visitable: boolean;
  distance_meters: number | null;
}): PlaceResult {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    category: row.category,
    isVisitable: row.is_visitable,
    distanceMeters: row.distance_meters,
  };
}

/** Condomínio aparece pelo nome, mas não dá para registrar visita nele (D3). */
export function isSelectablePlace(place: Pick<PlaceResult, "category">): boolean {
  return place.category !== RESIDENTIAL_CATEGORY;
}

export function isValidPosition(position: Position): boolean {
  return (
    Number.isFinite(position.latitude) &&
    Number.isFinite(position.longitude) &&
    Math.abs(position.latitude) <= 90 &&
    Math.abs(position.longitude) <= 180
  );
}
