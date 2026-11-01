// Gera os dados de demonstração (usuários, quem segue quem e visitas) para os
// lugares reais de web/src/data/places.json e grava web/src/data/demo.json.
//
// Uso (em web/): npm run seed:demo
//
// Usa números aleatórios com semente fixa (42): rodar de novo dá exatamente o
// mesmo arquivo. Não altera nenhum lugar. Antes de gravar, confere as regras
// abaixo e para com erro se alguma falhar.
//
// Notas puxadas para cima de propósito: são estabelecimentos reais, e a
// demonstração não deve simular avaliação ruim de negócio de verdade.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const PLACES_PATH = fileURLToPath(new URL("../src/data/places.json", import.meta.url));
const OUTPUT_PATH = fileURLToPath(new URL("../src/data/demo.json", import.meta.url));

export const SEED = 42;
export const CURRENT_USER_ID = "u0";

/** Victor (logado) e mais 11 pessoas fictícias. Victor segue as 8 primeiras. */
export const USERS = [
  { id: "u0", name: "Victor Ramos", username: "victorramos" },
  { id: "u1", name: "Bia Andrade", username: "biaandrade" },
  { id: "u2", name: "Caio Mendes", username: "caiomendes" },
  { id: "u3", name: "Duda Freitas", username: "dudafreitas" },
  { id: "u4", name: "Marina Costa", username: "marinacosta" },
  { id: "u5", name: "Rafael Lima", username: "rafaellima" },
  { id: "u6", name: "Gabriel Santos", username: "gabrielsantos" },
  { id: "u7", name: "Larissa Pereira", username: "larissapereira" },
  { id: "u8", name: "Thiago Almeida", username: "thiagoalmeida" },
  { id: "u9", name: "Fernanda Ribeiro", username: "fernandaribeiro" },
  { id: "u10", name: "Pedro Carvalho", username: "pedrocarvalho" },
  { id: "u11", name: "Camila Martins", username: "camilamartins" },
];
const FOLLOWED_BY_VICTOR = ["u1", "u2", "u3", "u4", "u5", "u6", "u7", "u8"];

/** Visitas de cada pessoa além do Victor (soma 182; com as 18 dele, 200). */
const OTHER_VISIT_COUNTS = [25, 22, 20, 19, 17, 16, 15, 14, 13, 11, 10];
const VICTOR_VISITS = 18;
/** Fração dos lugares que fica sem nenhuma visita. */
const UNVISITED_SHARE = 0.15;

/** Lugares que aparecem mais que a média (por nome, sem acento e minúsculo). */
const POPULAR_NAMES = ["cine-theatro central", "mariano procopio", "parque halfeld", "morro do imperador"];

const DATE_FROM = "2026-05-01";
const DATE_TO = "2026-10-28";
/** Peso de cada mês nas datas: mais visitas nos meses recentes. */
const MONTH_WEIGHTS = { 5: 8, 6: 10, 7: 14, 8: 18, 9: 22, 10: 28 };

/** Ocasiões que fazem sentido em cada categoria, com peso. */
const OCCASIONS_BY_CATEGORY = {
  restaurant: { with_family: 3, with_friends: 3, romantic: 2, work_study: 1, solo: 1 },
  bar: { with_friends: 5, romantic: 2, solo: 1 },
  cafe: { work_study: 3, solo: 3, with_friends: 2 },
  bakery: { with_family: 3, solo: 2, with_friends: 1 },
  bookstore: { solo: 4, work_study: 2, with_friends: 1 },
  ice_cream: { with_family: 4, with_friends: 3 },
  pizzeria: { with_friends: 3, with_family: 3, romantic: 2 },
  burger: { with_friends: 4, with_family: 2, solo: 1 },
  brewery: { with_friends: 5, solo: 1 },
  dessert_shop: { with_family: 3, with_friends: 2, solo: 1 },
  museum: { with_family: 3, solo: 2, with_friends: 2, work_study: 1 },
  park: { with_family: 4, with_friends: 3, solo: 2 },
  cultural_center: { with_friends: 3, solo: 2, with_family: 1, romantic: 1 },
  cinema: { with_friends: 3, romantic: 2, with_family: 2, solo: 1 },
};
/** Pares que não combinam na mesma visita (ex.: "Sozinho(a)" e "Com amigos"). */
const INCOMPATIBLE = [
  ["solo", "with_friends"],
  ["solo", "with_family"],
  ["solo", "romantic"],
  ["romantic", "with_friends"],
  ["romantic", "with_family"],
  ["romantic", "work_study"],
  ["work_study", "with_family"],
];

/** Gerador de números aleatórios com semente (mulberry32): mesmo resultado sempre. */
export function createRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickWeighted(random, entries) {
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = random() * total;
  for (const [value, weight] of entries) {
    roll -= weight;
    if (roll < 0) return value;
  }
  return entries[entries.length - 1][0];
}

function shuffle(random, items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Sorteia `count` itens diferentes, com peso. */
function sampleWeighted(random, items, weightOf, count) {
  const pool = [...items];
  const chosen = [];
  while (chosen.length < count && pool.length) {
    const item = pickWeighted(random, pool.map((p) => [p, weightOf(p)]));
    chosen.push(item);
    pool.splice(pool.indexOf(item), 1);
  }
  return chosen;
}

const normalize = (text) => text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

/** Distância aproximada, em km, do centro de Juiz de Fora. */
function kmFromCenter([lng, lat]) {
  const [centerLng, centerLat] = [-43.35, -21.76];
  const dx = (lng - centerLng) * 111.32 * Math.cos((centerLat * Math.PI) / 180);
  const dy = (lat - centerLat) * 110.57;
  return Math.hypot(dx, dy);
}

function randomDate(random) {
  const month = Number(pickWeighted(random, Object.entries(MONTH_WEIGHTS)));
  const lastDay = month === 10 ? 28 : new Date(Date.UTC(2026, month, 0)).getUTCDate();
  const day = 1 + Math.floor(random() * lastDay);
  return `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function pickOccasions(random, category) {
  const options = Object.entries(OCCASIONS_BY_CATEGORY[category]);
  const count = Number(pickWeighted(random, [[0, 25], [1, 50], [2, 25]]));
  const chosen = [];
  for (let i = 0; i < count; i++) {
    const compatible = options.filter(
      ([occasion]) =>
        !chosen.includes(occasion) &&
        !chosen.some((other) => INCOMPATIBLE.some(([a, b]) => (a === occasion && b === other) || (b === occasion && a === other))),
    );
    if (!compatible.length) break;
    chosen.push(pickWeighted(random, compatible));
  }
  return chosen;
}

/**
 * Gera usuários, quem o Victor segue e as visitas. Função pura: a mesma
 * lista de lugares e a mesma semente dão sempre o mesmo resultado.
 */
export function generateDemo(places, seed = SEED) {
  const random = createRandom(seed);
  const placeById = new Map(places.map((place) => [place.id, place]));

  const popularIds = new Set(
    POPULAR_NAMES.map((name) => {
      const found = places.filter((place) => normalize(place.name).includes(name));
      if (found.length !== 1) throw new Error(`Lugar popular "${name}": esperava 1, achei ${found.length}.`);
      return found[0].id;
    }),
  );
  const isPopular = (place) => popularIds.has(place.id) || place.category === "brewery";
  const weightOf = (place) => (popularIds.has(place.id) ? 5 : place.category === "brewery" ? 3 : 1);

  // 1. Cerca de 15% dos lugares ficam sem visita (nunca os populares).
  const unvisitedCount = Math.round(places.length * UNVISITED_SHARE);
  const unvisited = new Set(shuffle(random, places.filter((p) => !isPopular(p))).slice(0, unvisitedCount).map((p) => p.id));
  const eligible = places.filter((place) => !unvisited.has(place.id));

  // 2. Nota "de base" de cada lugar; as visitas variam em volta dela.
  const baseRating = new Map(
    places.map((place) => [
      place.id,
      isPopular(place)
        ? Number(pickWeighted(random, [[4, 30], [4.5, 60], [5, 10]]))
        : Number(pickWeighted(random, [[3, 6], [3.5, 20], [4, 40], [4.5, 28], [5, 6]])),
    ]),
  );

  // 3. Lugares de cada pessoa. Victor: categorias variadas e longe do Centro.
  const visitPlan = []; // { userId, placeId, revisit }
  const victorRevisits = 1;
  const byCategory = Map.groupBy(eligible, (place) => place.category);
  const victorCategories = shuffle(random, [...byCategory.keys()]).slice(0, 12);
  const victorPlaces = victorCategories.map((category) =>
    pickWeighted(random, byCategory.get(category).map((place) => [place, 1 + kmFromCenter(place.location)])),
  );
  victorPlaces.push(
    ...sampleWeighted(
      random,
      eligible.filter((place) => !victorPlaces.includes(place)),
      (place) => weightOf(place) * (1 + kmFromCenter(place.location) / 2),
      VICTOR_VISITS - victorRevisits - victorPlaces.length,
    ),
  );
  const plans = [{ userId: CURRENT_USER_ID, places: victorPlaces, revisits: victorRevisits }];

  const others = shuffle(random, USERS.filter((user) => user.id !== CURRENT_USER_ID));
  others.forEach((user, i) => {
    const total = OTHER_VISIT_COUNTS[i];
    const revisits = Number(pickWeighted(random, [[0, 40], [1, 40], [2, 20]]));
    plans.push({ userId: user.id, places: sampleWeighted(random, eligible, weightOf, total - revisits), revisits });
  });

  // 4. Ajustes do sorteio, sempre trocando uma visita do lugar comum com mais
  // pessoas (pelo menos 2, para ele não esvaziar) pelo lugar que precisa:
  //    a) cada lugar popular chega a pelo menos 4 pessoas diferentes;
  //    b) todo lugar elegível tem pelo menos 1 visita.
  const distinctUsers = () => {
    const users = new Map(eligible.map((place) => [place.id, new Set()]));
    for (const plan of plans) for (const place of plan.places) users.get(place.id).add(plan.userId);
    return users;
  };
  const giveOneVisit = (target) => {
    const users = distinctUsers();
    const [donor] = plans
      .filter((plan) => plan.userId !== CURRENT_USER_ID && !plan.places.includes(target))
      .flatMap((plan) => plan.places.map((place) => ({ plan, place })))
      .filter(({ place }) => !isPopular(place) && users.get(place.id).size >= 2)
      .sort((a, b) => users.get(b.place.id).size - users.get(a.place.id).size);
    if (!donor) throw new Error(`Não consegui dar uma visita a ${target.name}.`);
    donor.plan.places[donor.plan.places.indexOf(donor.place)] = target;
  };
  for (const popular of eligible.filter(isPopular)) {
    while (distinctUsers().get(popular.id).size < 4) giveOneVisit(popular);
  }
  for (const place of eligible) {
    if (distinctUsers().get(place.id).size === 0) giveOneVisit(place);
  }

  for (const plan of plans) {
    for (const place of plan.places) visitPlan.push({ userId: plan.userId, placeId: place.id });
    for (const place of shuffle(random, plan.places).slice(0, plan.revisits)) {
      visitPlan.push({ userId: plan.userId, placeId: place.id, revisit: true });
    }
  }

  // 5. Datas, notas e ocasiões. Revisitas ganham uma data diferente da primeira.
  const visits = visitPlan.map(({ userId, placeId }) => {
    const place = placeById.get(placeId);
    // Variação de -1 a +0,5 em volta da base: no mesmo lugar, no máximo 1,5
    // de diferença entre as notas, e nunca abaixo de 2,0.
    const delta = Number(pickWeighted(random, [[-1, 6], [-0.5, 26], [0, 42], [0.5, 26]]));
    const rating = Math.min(5, Math.max(2, baseRating.get(placeId) + delta));
    return { userId, placeId, visitedOn: randomDate(random), rating, occasions: pickOccasions(random, place.category) };
  });
  const sameDay = (a, b) => a.userId === b.userId && a.placeId === b.placeId && a.visitedOn === b.visitedOn;
  for (let i = 0; i < visits.length; i++) {
    while (visits.slice(0, i).some((earlier) => sameDay(earlier, visits[i]))) {
      visits[i].visitedOn = randomDate(random);
    }
  }

  visits.sort(
    (a, b) =>
      a.visitedOn.localeCompare(b.visitedOn) ||
      a.userId.localeCompare(b.userId, "en", { numeric: true }) ||
      a.placeId.localeCompare(b.placeId),
  );
  const demo = {
    seed,
    currentUserId: CURRENT_USER_ID,
    users: USERS.map((user) => ({ ...user, homeCityId: "jf" })),
    follows: FOLLOWED_BY_VICTOR.map((followeeId) => ({ followerId: CURRENT_USER_ID, followeeId })),
    visits: visits.map((visit, i) => ({ id: `v${String(i + 1).padStart(3, "0")}`, ...visit })),
  };
  checkRules(demo, places, popularIds);
  return demo;
}

/** Confere as regras pedidas para a demonstração. Lança erro na primeira que falhar. */
export function checkRules(demo, places, popularIds) {
  const fail = (message) => {
    throw new Error(`Regra não atendida: ${message}`);
  };
  const placeById = new Map(places.map((place) => [place.id, place]));
  const userIds = new Set(demo.users.map((user) => user.id));
  const { visits } = demo;

  if (visits.length < 180 || visits.length > 220) fail(`${visits.length} visitas (esperado ~200).`);
  for (const visit of visits) {
    if (!placeById.has(visit.placeId)) fail(`visita ${visit.id} aponta para lugar inexistente.`);
    if (!userIds.has(visit.userId)) fail(`visita ${visit.id} aponta para usuário inexistente.`);
    if (visit.rating < 2 || visit.rating > 5 || !Number.isInteger(visit.rating * 2)) fail(`nota ${visit.rating} na ${visit.id}.`);
    if (visit.visitedOn < DATE_FROM || visit.visitedOn > DATE_TO) fail(`data ${visit.visitedOn} na ${visit.id}.`);
    if (visit.occasions.length > 2) fail(`${visit.occasions.length} ocasiões na ${visit.id}.`);
    const category = placeById.get(visit.placeId).category;
    for (const occasion of visit.occasions) {
      if (!(occasion in OCCASIONS_BY_CATEGORY[category])) fail(`ocasião ${occasion} em ${category} (${visit.id}).`);
    }
    const [first, second] = visit.occasions;
    if (second && INCOMPATIBLE.some(([a, b]) => (a === first && b === second) || (a === second && b === first))) {
      fail(`ocasiões que não combinam na ${visit.id}: ${first} e ${second}.`);
    }
  }
  const visitKeys = visits.map((visit) => `${visit.userId}|${visit.placeId}|${visit.visitedOn}`);
  if (new Set(visitKeys).size !== visitKeys.length) fail("revisita na mesma data da visita anterior.");

  const perUser = Map.groupBy(visits, (visit) => visit.userId);
  if (perUser.get(CURRENT_USER_ID)?.length !== VICTOR_VISITS) fail(`Victor com ${perUser.get(CURRENT_USER_ID)?.length} visitas.`);
  for (const [userId, list] of perUser) {
    if (userId !== CURRENT_USER_ID && (list.length < 8 || list.length > 25)) fail(`${userId} com ${list.length} visitas.`);
    const repeats = list.length - new Set(list.map((visit) => visit.placeId)).size;
    if (repeats > 2) fail(`${userId} revisitou ${repeats} lugares.`);
  }
  const victorCategories = new Set(perUser.get(CURRENT_USER_ID).map((visit) => placeById.get(visit.placeId).category));
  if (victorCategories.size < 10) fail(`Victor só visitou ${victorCategories.size} categorias.`);

  const perPlace = Map.groupBy(visits, (visit) => visit.placeId);
  const unvisited = places.length - perPlace.size;
  if (unvisited < places.length * 0.1 || unvisited > places.length * 0.2) fail(`${unvisited} lugares sem visita.`);
  const sharedPlaces = [...perPlace.values()].filter((list) => {
    const people = new Set(list.map((visit) => visit.userId)).size;
    return people >= 2 && people <= 4;
  });
  if (sharedPlaces.length < 30) fail(`só ${sharedPlaces.length} lugares com 2 a 4 pessoas diferentes.`);
  for (const [placeId, list] of perPlace) {
    const ratings = list.map((visit) => visit.rating);
    if (Math.max(...ratings) - Math.min(...ratings) > 1.5) fail(`notas muito distantes em ${placeById.get(placeId).name}.`);
  }

  const average = visits.length / perPlace.size;
  for (const place of places) {
    const popular = popularIds.has(place.id) || place.category === "brewery";
    if (popular && (perPlace.get(place.id)?.length ?? 0) <= average) fail(`${place.name} não ficou acima da média.`);
  }

  const lowRatings = visits.filter((visit) => visit.rating < 3).length;
  const highRatings = visits.filter((visit) => visit.rating >= 3.5).length;
  if (highRatings <= visits.length / 2) fail(`só ${highRatings} notas de 3,5 para cima.`);
  if (lowRatings > visits.length * 0.1) fail(`${lowRatings} notas abaixo de 3,0.`);
}

/** Uma visita por linha, para o arquivo ficar fácil de ler e de comparar. */
function formatDemo(demo) {
  const line = (item) => `    ${JSON.stringify(item)}`;
  return [
    "{",
    `  "seed": ${demo.seed},`,
    `  "currentUserId": ${JSON.stringify(demo.currentUserId)},`,
    `  "users": [\n${demo.users.map(line).join(",\n")}\n  ],`,
    `  "follows": [\n${demo.follows.map(line).join(",\n")}\n  ],`,
    `  "visits": [\n${demo.visits.map(line).join(",\n")}\n  ]`,
    "}",
    "",
  ].join("\n");
}

function main() {
  const places = JSON.parse(readFileSync(PLACES_PATH, "utf8"));
  const demo = generateDemo(places);
  writeFileSync(OUTPUT_PATH, formatDemo(demo), "utf8");

  const placeById = new Map(places.map((place) => [place.id, place]));
  const userById = new Map(demo.users.map((user) => [user.id, user]));
  console.log(`Semente ${demo.seed}: ${demo.users.length} usuários, ${demo.visits.length} visitas (web/src/data/demo.json)`);
  console.log("\nVisitas por usuário:");
  for (const [userId, list] of Map.groupBy(demo.visits, (visit) => visit.userId)) {
    const followed = demo.follows.some((f) => f.followeeId === userId) ? " (Victor segue)" : "";
    console.log(`  ${userById.get(userId).name.padEnd(17)} ${String(list.length).padStart(2)}${followed}`);
  }
  console.log("\n10 lugares com mais visitas (visitas / pessoas diferentes):");
  const ranking = [...Map.groupBy(demo.visits, (visit) => visit.placeId)]
    .map(([placeId, list]) => ({ name: placeById.get(placeId).name, visits: list.length, people: new Set(list.map((v) => v.userId)).size }))
    .sort((a, b) => b.visits - a.visits || b.people - a.people || a.name.localeCompare(b.name, "pt-BR"));
  for (const { name, visits, people } of ranking.slice(0, 10)) console.log(`  ${name.padEnd(36)} ${visits} / ${people}`);
  const shared = ranking.filter(({ people }) => people >= 2 && people <= 4).length;
  console.log(`\nLugares com 2 a 4 pessoas diferentes: ${shared} · sem visita: ${places.length - ranking.length}`);
  console.log("\nNotas:");
  for (const [rating, list] of [...Map.groupBy(demo.visits, (visit) => visit.rating)].sort((a, b) => a[0] - b[0])) {
    console.log(`  ${rating.toFixed(1).replace(".", ",")}: ${list.length}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
