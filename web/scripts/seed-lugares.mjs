// Importa os lugares de data/seed/lugares_jf_seed.csv para web/src/data/places.json,
// que é de onde o app lê os lugares enquanto não existe banco (Fatia 2 em diante).
//
// Uso (em web/): npm run seed:lugares
//
// É idempotente: atualiza cada lugar pela chave (id_overture ou, sem ele,
// nome + lat + lng) em vez de acrescentar. Rodar duas vezes dá o mesmo arquivo.
// Lugares que já estão no arquivo e não vêm no CSV são mantidos, como faria um
// "upsert" no banco; o script só avisa quantos são.

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const CSV_PATH = fileURLToPath(new URL("../../data/seed/lugares_jf_seed.csv", import.meta.url));
const OUTPUT_PATH = fileURLToPath(new URL("../src/data/places.json", import.meta.url));

/** categoria_app do CSV → categoria do app (glossário, "Categorias de lugar"). */
export const SEED_CATEGORIES = {
  Restaurante: "restaurant",
  Bar: "bar",
  Café: "cafe",
  Padaria: "bakery",
  Livraria: "bookstore",
  Sorveteria: "ice_cream",
  Pizzaria: "pizzeria",
  Hamburgueria: "burger",
  Cervejaria: "brewery",
  Doceria: "dessert_shop",
  Museu: "museum",
  Parque: "park",
  "Centro cultural": "cultural_center",
  Cinema: "cinema",
};

/** Cidades que o app conhece: cidade + UF + país do CSV → id da cidade. */
const SEED_CITIES = { "Juiz de Fora|MG|Brasil": "jf" };

const REQUIRED_COLUMNS = ["id_overture", "nome", "categoria_app", "endereco", "cep", "cidade", "uf", "pais", "lat", "lng"];

/**
 * Lê um CSV separado por vírgulas, com campos entre aspas quando têm vírgula,
 * aspas ou quebra de linha (RFC 4180). Ignora o BOM do começo, se houver.
 */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  const input = text.replace(/^﻿/, "");

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (quoted) {
      if (char === '"' && input[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && input[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const [header, ...data] = rows.filter((r) => r.some((value) => value.trim() !== ""));
  return data.map((values) => Object.fromEntries(header.map((name, i) => [name.trim(), (values[i] ?? "").trim()])));
}

/** Minúsculas, sem acento e sem pontuação (o "nome normalizado" da D4). */
function normalizeName(name) {
  return name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Chave do lugar: o id do Overture ou, sem ele, nome normalizado + coordenadas. */
export function placeKey({ gersId, name, location }) {
  return gersId ?? `${normalizeName(name)}|${location[1]}|${location[0]}`;
}

/** Converte uma linha do CSV num lugar do app. Lança erro se algo não bate. */
export function rowToPlace(row, line) {
  const missing = REQUIRED_COLUMNS.filter((column) => !(column in row));
  if (missing.length) throw new Error(`Linha ${line}: faltam as colunas ${missing.join(", ")}.`);

  const name = row.nome;
  if (!name) throw new Error(`Linha ${line}: lugar sem nome.`);

  const category = SEED_CATEGORIES[row.categoria_app];
  if (!category) throw new Error(`Linha ${line} (${name}): categoria "${row.categoria_app}" não existe no app.`);

  const cityId = SEED_CITIES[`${row.cidade}|${row.uf}|${row.pais}`];
  if (!cityId) throw new Error(`Linha ${line} (${name}): cidade "${row.cidade}/${row.uf}/${row.pais}" não existe no app.`);

  // As coordenadas vêm do CSV; não há geocodificação por endereço ou CEP.
  // Texto vazio é recusado antes: Number("") dá 0, um ponto no meio do oceano.
  const lat = row.lat === "" ? NaN : Number(row.lat);
  const lng = row.lng === "" ? NaN : Number(row.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    throw new Error(`Linha ${line} (${name}): coordenadas inválidas (lat "${row.lat}", lng "${row.lng}").`);
  }

  const gersId = row.id_overture || undefined;
  const place = {
    id: "",
    gersId,
    name,
    category,
    cityId,
    location: [lng, lat],
    address: row.endereco || undefined,
    postalCode: row.cep || undefined,
  };
  // Sem banco, o id interno é o do Overture; sem ele, um resumo estável da chave.
  place.id = gersId ?? `seed-${createHash("sha1").update(placeKey(place)).digest("hex").slice(0, 12)}`;
  return place;
}

/**
 * Junta os lugares do CSV aos que já existem, pela chave. Devolve a lista nova,
 * em ordem estável, e um resumo do que mudou.
 */
export function upsertPlaces(existing, incoming) {
  const byKey = new Map(existing.map((place) => [placeKey(place), place]));
  const seen = new Set();
  const summary = { inserted: 0, updated: 0, unchanged: 0, keptFromBefore: 0 };

  for (const place of incoming) {
    const key = placeKey(place);
    if (seen.has(key)) throw new Error(`Lugar repetido no CSV: ${place.name} (${key}).`);
    seen.add(key);

    const current = byKey.get(key);
    if (!current) summary.inserted++;
    else if (JSON.stringify(current) === JSON.stringify(place)) summary.unchanged++;
    else summary.updated++;
    byKey.set(key, place);
  }
  summary.keptFromBefore = [...byKey.keys()].filter((key) => !seen.has(key)).length;

  const places = [...byKey.values()].sort(
    (a, b) => a.name.localeCompare(b.name, "pt-BR") || a.id.localeCompare(b.id),
  );
  return { places, summary };
}

function main() {
  const rows = parseCsv(readFileSync(CSV_PATH, "utf8"));
  // Linha 1 é o cabeçalho, então a primeira linha de dados é a 2.
  const incoming = rows.map((row, i) => rowToPlace(row, i + 2));
  const existing = existsSync(OUTPUT_PATH) ? JSON.parse(readFileSync(OUTPUT_PATH, "utf8")) : [];
  const { places, summary } = upsertPlaces(existing, incoming);

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, `${JSON.stringify(places, null, 2)}\n`, "utf8");

  const byCategory = {};
  for (const place of places) byCategory[place.category] = (byCategory[place.category] ?? 0) + 1;

  console.log(`CSV: ${rows.length} linhas lidas de data/seed/lugares_jf_seed.csv`);
  console.log(
    `Novos: ${summary.inserted} · atualizados: ${summary.updated} · sem mudança: ${summary.unchanged} · fora do CSV, mantidos: ${summary.keptFromBefore}`,
  );
  console.log(`Total no app: ${places.length} lugares (web/src/data/places.json)`);
  for (const [category, count] of Object.entries(byCategory).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${category}: ${count}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
