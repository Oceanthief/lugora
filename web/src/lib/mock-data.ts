/**
 * Dados fictícios da Fatia 0. Pessoas, lugares e visitas são inventados; só
 * as cidades e os bairros são reais.
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

/** Lista fixa de ocasiões (seção 7.8). No banco, vira a tabela `tags`. */
export const occasions = [
  "romantic",
  "with_friends",
  "with_family",
  "solo",
  "work_study",
] as const;

export type Occasion = (typeof occasions)[number];

export type MockCity = {
  id: string;
  name: string;
  /** Código do país (ISO 3166-1), como "BR". */
  countryCode: string;
  /** [longitude, latitude], nessa ordem (como o GeoJSON e o MapLibre). */
  center: [lng: number, lat: number];
};

export type MockPlace = {
  id: string;
  name: string;
  category: PlaceCategory;
  cityId: string;
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
  /** Até 3 (seção 7.8). */
  occasions: readonly Occasion[];
};

export type MockUser = {
  id: string;
  name: string;
  username: string;
};

export type FeedVisit = MockVisit & { userId: string };

export type WantToGoItem = {
  id: string;
  placeId: string;
  /** "Onde eu vi" (seção 7.14). */
  sourceUrl?: string;
  addedOn: string;
};

export const mockCities: readonly MockCity[] = [
  { id: "jf", name: "Juiz de Fora", countryCode: "BR", center: [-43.35, -21.76] },
  { id: "rio", name: "Rio de Janeiro", countryCode: "BR", center: [-43.2, -22.95] },
  { id: "lisboa", name: "Lisboa", countryCode: "PT", center: [-9.14, 38.72] },
];

export const mockPlaces: readonly MockPlace[] = [
  // Juiz de Fora: Centro
  { id: "p1", name: "Café Meia-Lua", category: "cafe", cityId: "jf", location: [-43.3483, -21.7637] },
  // São Mateus
  { id: "p2", name: "Bar da Ladeira", category: "bar", cityId: "jf", location: [-43.3586, -21.7717] },
  // Granbery
  { id: "p3", name: "Padaria Pão Quente", category: "bakery", cityId: "jf", location: [-43.3423, -21.7705] },
  // Cascatinha
  { id: "p4", name: "Cantina da Serra", category: "restaurant", cityId: "jf", location: [-43.359, -21.7809] },
  // Poço Rico
  { id: "p5", name: "Livraria Entrelinhas", category: "bookstore", cityId: "jf", location: [-43.338, -21.761] },
  // Jardim Santa Helena
  { id: "p6", name: "Sorveteria Ipê Amarelo", category: "ice_cream", cityId: "jf", location: [-43.3479, -21.7566] },
  // Mariano Procópio
  { id: "p7", name: "Boteco da Estação", category: "bar", cityId: "jf", location: [-43.3586, -21.7478] },
  // Bom Pastor
  { id: "p8", name: "Restaurante Varanda Verde", category: "restaurant", cityId: "jf", location: [-43.3491, -21.7753] },
  // Rio de Janeiro: Copacabana
  { id: "p9", name: "Quiosque Maré Alta", category: "bar", cityId: "rio", location: [-43.1822, -22.9711] },
  // Lisboa: Alfama
  { id: "p10", name: "Tasca do Miradouro", category: "restaurant", cityId: "lisboa", location: [-9.13, 38.7115] },
  // Lisboa: Bairro Alto
  { id: "p11", name: "Pastelaria Sete Colinas", category: "bakery", cityId: "lisboa", location: [-9.1445, 38.713] },
  // Juiz de Fora: Bairu (ainda não visitado)
  { id: "p12", name: "Empório Recanto", category: "cafe", cityId: "jf", location: [-43.3535, -21.7395] },
  // Juiz de Fora: Santa Luzia (ainda não visitado)
  { id: "p13", name: "Bistrô Alto da Serra", category: "restaurant", cityId: "jf", location: [-43.3449, -21.7867] },
  // Lisboa: Chiado (ainda não visitado)
  { id: "p14", name: "Livraria Rua Torta", category: "bookstore", cityId: "lisboa", location: [-9.1415, 38.7105] },
];

/** Quem está usando o app nesta demonstração. */
export const mockProfile = {
  name: "Alex Rocha",
  username: "alexrocha",
  /** Privada: só a própria pessoa vê (seção 9.3). */
  homeCityId: "jf",
};

/** As visitas de quem está usando o app. */
export const mockVisits: readonly MockVisit[] = [
  { id: "v1", placeId: "p1", visitedOn: "2026-09-12", rating: 4, occasions: ["work_study"] },
  { id: "v2", placeId: "p2", visitedOn: "2026-09-20", rating: 4.5, occasions: ["with_friends"] },
  { id: "v3", placeId: "p3", visitedOn: "2026-10-01", rating: 3.5, occasions: [] },
  { id: "v4", placeId: "p4", visitedOn: "2026-10-05", rating: 5, occasions: ["romantic"] },
  { id: "v5", placeId: "p5", visitedOn: "2026-10-09", rating: 4.5, occasions: ["solo"] },
  { id: "v6", placeId: "p6", visitedOn: "2026-10-14", rating: 3, occasions: ["with_family"] },
  { id: "v7", placeId: "p7", visitedOn: "2026-10-18", rating: 4, occasions: ["with_friends"] },
  { id: "v8", placeId: "p8", visitedOn: "2026-10-22", rating: 2.5, occasions: ["with_family"] },
  // Segunda visita ao Café Meia-Lua: no mapa, continua sendo 1 lugar.
  { id: "v9", placeId: "p1", visitedOn: "2026-10-25", rating: 4.5, occasions: ["solo", "work_study"] },
  // Viagens
  { id: "v10", placeId: "p9", visitedOn: "2026-07-18", rating: 4.5, occasions: ["with_friends"] },
  { id: "v11", placeId: "p10", visitedOn: "2026-08-03", rating: 5, occasions: ["romantic"] },
  { id: "v12", placeId: "p11", visitedOn: "2026-08-05", rating: 4, occasions: ["solo"] },
];

/** Pessoas que quem está usando o app segue. */
export const mockFollowing: readonly MockUser[] = [
  { id: "u1", name: "Bia Andrade", username: "biaandrade" },
  { id: "u2", name: "Caio Mendes", username: "caiomendes" },
  { id: "u3", name: "Duda Freitas", username: "dudafreitas" },
];

/** Visitas de quem é seguido, fora de ordem de propósito. */
export const mockFeedVisits: readonly FeedVisit[] = [
  { id: "f1", userId: "u1", placeId: "p4", visitedOn: "2026-10-26", rating: 4.5, occasions: ["romantic"] },
  { id: "f2", userId: "u2", placeId: "p2", visitedOn: "2026-10-24", rating: 4, occasions: ["with_friends"] },
  { id: "f3", userId: "u3", placeId: "p10", visitedOn: "2026-10-27", rating: 5, occasions: ["with_family", "romantic"] },
  { id: "f4", userId: "u1", placeId: "p5", visitedOn: "2026-10-20", rating: 3.5, occasions: ["solo", "work_study"] },
  { id: "f5", userId: "u2", placeId: "p6", visitedOn: "2026-10-27", rating: 4, occasions: [] },
];

/** A lista "Quero ir" de quem está usando o app (privada por padrão). */
export const mockWantToGo: readonly WantToGoItem[] = [
  { id: "w1", placeId: "p12", sourceUrl: "https://www.instagram.com/p/lugora-exemplo/", addedOn: "2026-10-21" },
  { id: "w2", placeId: "p14", sourceUrl: "https://www.tiktok.com/@lugora.exemplo/video/1", addedOn: "2026-10-15" },
  { id: "w3", placeId: "p13", addedOn: "2026-09-30" },
];

export function getCity(cityId: string): MockCity | undefined {
  return mockCities.find((city) => city.id === cityId);
}

/** Um lugar visitado, com a visita mais recente a ele. */
export type VisitedPlace = MockPlace & Pick<MockVisit, "visitedOn" | "rating">;

/**
 * Lugares com pelo menos uma visita, cada um uma vez só, com a nota e a data
 * da visita mais recente (seção 7.1). Provisório: o mapa de verdade vem na
 * Fatia 4.
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

export type FeedItem = {
  visit: FeedVisit;
  user: MockUser;
  place: MockPlace;
  city: MockCity;
};

/**
 * Feed em ordem cronológica, da visita mais recente para a mais antiga
 * (seção 7.13). Ainda não aplica visibilidade nem atraso de publicação:
 * isso vem com o banco, na Fatia 9.
 */
export function getFeed(
  visits: readonly FeedVisit[] = mockFeedVisits,
): FeedItem[] {
  return visits
    .flatMap((visit) => {
      const user = mockFollowing.find((u) => u.id === visit.userId);
      const place = mockPlaces.find((p) => p.id === visit.placeId);
      const city = place && getCity(place.cityId);
      return user && place && city ? [{ visit, user, place, city }] : [];
    })
    .sort(
      (a, b) =>
        b.visit.visitedOn.localeCompare(a.visit.visitedOn) ||
        a.visit.id.localeCompare(b.visit.id),
    );
}

export type WantToGoEntry = {
  item: WantToGoItem;
  place: MockPlace;
  city: MockCity;
};

/** A lista "Quero ir", do item adicionado mais recentemente ao mais antigo. */
export function getWantToGo(): WantToGoEntry[] {
  return mockWantToGo
    .flatMap((item) => {
      const place = mockPlaces.find((p) => p.id === item.placeId);
      const city = place && getCity(place.cityId);
      return place && city ? [{ item, place, city }] : [];
    })
    .sort((a, b) => b.item.addedOn.localeCompare(a.item.addedOn));
}
