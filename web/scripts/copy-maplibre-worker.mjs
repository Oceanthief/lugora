// Copia o worker do MapLibre para public/, de onde o navegador o baixa.
//
// O MapLibre desenha o mapa numa thread separada (um Web Worker) e procura o
// arquivo dela ao lado do próprio código. O Turbopack junta esse código num
// pacote em outro lugar, então o arquivo some. A cópia resolve isso e
// acompanha a versão instalada, porque roda antes de `npm run dev` e
// `npm run build` (scripts predev e prebuild do package.json).

import { copyFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const source = fileURLToPath(
  import.meta.resolve("maplibre-gl/dist/maplibre-gl-worker.mjs"),
);
const publicDir = new URL("../public/", import.meta.url);

mkdirSync(publicDir, { recursive: true });
copyFileSync(source, new URL("maplibre-gl-worker.mjs", publicDir));
