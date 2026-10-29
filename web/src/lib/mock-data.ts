/**
 * Dados fictícios da Fatia 0. Os lugares e as visitas são inventados; só os
 * bairros de Juiz de Fora são reais.
 *
 * Este arquivo é o único ponto de dados do app até o banco chegar
 * (Fatia 2 em diante): as telas importam daqui, e depois passam a ler do
 * Supabase.
 */

export type PlaceCategory =
  | "cafe"
  | "bar"
  | "restaurant"
  | "bakery"
  | "bookstore"
  | "ice_cream";

export type MockPlace = {
  id: string;
  name: string;
  category: PlaceCategory;
  /** [longitude, latitude], nessa ordem (como o GeoJSON e o MapLibre). */
  location: [lng: number, lat: number];
};

export type MockVisit = {
  id: string;
  placeId: string;
  /** Só a data, sem hora: AAAA-MM-DD. */
  visitedOn: string;
  /** De 0,5 a 5, em passos de 0,5. */
  rating: number;
};

export const mockPlaces: readonly MockPlace[] = [
  // Centro
  { id: "p1", name: "Café Meia-Lua", category: "cafe", location: [-43.3496, -21.7612] },
  // São Mateus
  { id: "p2", name: "Bar da Ladeira", category: "bar", location: [-43.3545, -21.774] },
  // Granbery
  { id: "p3", name: "Padaria Pão Quente", category: "bakery", location: [-43.3437, -21.768] },
  // Cascatinha
  { id: "p4", name: "Cantina da Serra", category: "restaurant", location: [-43.3625, -21.7835] },
  // Poço Rico
  { id: "p5", name: "Livraria Entrelinhas", category: "bookstore", location: [-43.339, -21.7635] },
  // Jardim Santa Helena
  { id: "p6", name: "Sorveteria Ipê Amarelo", category: "ice_cream", location: [-43.353, -21.757] },
  // Mariano Procópio
  { id: "p7", name: "Boteco da Estação", category: "bar", location: [-43.355, -21.748] },
  // Bom Pastor
  { id: "p8", name: "Restaurante Varanda Verde", category: "restaurant", location: [-43.3455, -21.7765] },
];

export const mockVisits: readonly MockVisit[] = [
  { id: "v1", placeId: "p1", visitedOn: "2026-09-12", rating: 4 },
  { id: "v2", placeId: "p2", visitedOn: "2026-09-20", rating: 4.5 },
  { id: "v3", placeId: "p3", visitedOn: "2026-10-01", rating: 3.5 },
  { id: "v4", placeId: "p4", visitedOn: "2026-10-05", rating: 5 },
  { id: "v5", placeId: "p5", visitedOn: "2026-10-09", rating: 4.5 },
  { id: "v6", placeId: "p6", visitedOn: "2026-10-14", rating: 3 },
  { id: "v7", placeId: "p7", visitedOn: "2026-10-18", rating: 4 },
  { id: "v8", placeId: "p8", visitedOn: "2026-10-22", rating: 2.5 },
  // Segunda visita ao Café Meia-Lua: no mapa, continua sendo 1 lugar.
  { id: "v9", placeId: "p1", visitedOn: "2026-10-25", rating: 4.5 },
];

/** Um lugar visitado, com a visita mais recente a ele. */
export type VisitedPlace = MockPlace & Pick<MockVisit, "visitedOn" | "rating">;

/**
 * Lugares com pelo menos uma visita, cada um uma vez só, com a nota e a data
 * da visita mais recente. Provisório: a regra de verdade vem na Fatia 4.
 */
export function getVisitedPlaces(
  places: readonly MockPlace[] = mockPlaces,
  visits: readonly MockVisit[] = mockVisits,
): VisitedPlace[] {
  const latestByPlace = new Map<string, MockVisit>();
  for (const visit of visits) {
    const current = latestByPlace.get(visit.placeId);
    // Datas AAAA-MM-DD podem ser comparadas como texto.
    if (!current || visit.visitedOn > current.visitedOn) {
      latestByPlace.set(visit.placeId, visit);
    }
  }

  return places.flatMap((place) => {
    const visit = latestByPlace.get(place.id);
    return visit
      ? [{ ...place, visitedOn: visit.visitedOn, rating: visit.rating }]
      : [];
  });
}
