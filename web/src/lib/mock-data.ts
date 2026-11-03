/**
 * Dados do app enquanto não existe banco (Fatia 2 em diante): as telas
 * importam daqui, e depois passam a ler do Supabase.
 *
 * - Lugares: 100 lugares reais de Juiz de Fora, importados de
 *   data/seed/lugares_jf_seed.csv para src/data/places.json pelo script
 *   `npm run seed:lugares`.
 * - Pessoas, quem segue quem e visitas: demonstração, gerada com semente fixa
 *   em src/data/demo.json pelo script `npm run seed:demo`. O usuário logado é
 *   o Victor Ramos, que tem 6 lugares no "Quero ir".
 *
 * Não edite os JSON à mão: rode os scripts. Os dados fictícios anteriores
 * estão em data/seed/mock-data_ficticio_backup.ts.
 */

import demoData from "../data/demo.json";
import placesData from "../data/places.json";
import type { PlaceCategory } from "./categories";

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
  /** UF no Brasil (estado_regiao, seção 8). */
  state?: string;
  /** Código do país (ISO 3166-1), como "BR". */
  countryCode: string;
  /** [longitude, latitude], nessa ordem (como o GeoJSON e o MapLibre). */
  center: [lng: number, lat: number];
};

export type MockPlace = {
  id: string;
  /** Id do Overture (GERS), para atualizar a base sem duplicar (D1 e D4). */
  gersId?: string;
  name: string;
  category: PlaceCategory;
  cityId: string;
  /** [longitude, latitude], nessa ordem (como o GeoJSON e o MapLibre). */
  location: [lng: number, lat: number];
  address?: string;
  /** CEP, como "36010-041". */
  postalCode?: string;
};

export type MockVisit = {
  id: string;
  /** Quem visitou (usuario_id, seção 8). */
  userId: string;
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
  /** Privada: só a própria pessoa vê (seção 9.3). */
  homeCityId: string;
};

export type WantToGoItem = {
  id: string;
  /** Dono da lista (usuario_id, seção 8). */
  userId: string;
  placeId: string;
  /** "Onde eu vi" (seção 7.14). */
  sourceUrl?: string;
  addedOn: string;
};

export const mockCities: readonly MockCity[] = [
  { id: "jf", name: "Juiz de Fora", state: "MG", countryCode: "BR", center: [-43.35, -21.76] },
];

/** Os lugares importados do CSV (veja o comentário do topo). */
export const mockPlaces: readonly MockPlace[] = placesData.map(
  (place): MockPlace => ({
    ...place,
    // O teste de mock-data confere que toda categoria do JSON existe no app.
    category: place.category as PlaceCategory,
    location: [place.location[0], place.location[1]],
  }),
);

/** Todas as pessoas da demonstração, incluindo quem está usando o app. */
export const mockUsers: readonly MockUser[] = demoData.users;

/** Quem está usando o app nesta demonstração (o Victor). */
export const mockProfile: MockUser = (() => {
  const user = mockUsers.find((u) => u.id === demoData.currentUserId);
  if (!user) throw new Error(`Usuário logado ${demoData.currentUserId} não está em demo.json.`);
  return user;
})();

/** As visitas de todas as pessoas. */
export const mockAllVisits: readonly MockVisit[] = demoData.visits.map(
  (visit): MockVisit => ({
    ...visit,
    // O teste de mock-data confere que toda ocasião do JSON existe no app.
    occasions: visit.occasions as Occasion[],
  }),
);

/** As visitas de quem está usando o app. */
export const mockVisits: readonly MockVisit[] = mockAllVisits.filter(
  (visit) => visit.userId === mockProfile.id,
);

const followedIds = new Set(
  demoData.follows
    .filter((follow) => follow.followerId === mockProfile.id)
    .map((follow) => follow.followeeId),
);

/** Pessoas que quem está usando o app segue. */
export const mockFollowing: readonly MockUser[] = mockUsers.filter((user) =>
  followedIds.has(user.id),
);

/** Visitas de quem é seguido: é o que entra no Feed. */
export const mockFeedVisits: readonly MockVisit[] = mockAllVisits.filter(
  (visit) => followedIds.has(visit.userId),
);

/** A lista "Quero ir" de quem está usando o app (privada por padrão). */
export const mockWantToGo: readonly WantToGoItem[] = demoData.wantToGo.filter(
  (item) => item.userId === mockProfile.id,
);

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
  visit: MockVisit;
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
  visits: readonly MockVisit[] = mockFeedVisits,
): FeedItem[] {
  return visits
    .flatMap((visit) => {
      const user = mockUsers.find((u) => u.id === visit.userId);
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
