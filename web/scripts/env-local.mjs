// Cria web/.env.local com o endereço e a chave pública do banco local.
// Pega só esses dois valores do `supabase status`, e nunca imprime a chave.
// A chave service_role fica de fora de propósito: ela não existe neste app.

import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../..", import.meta.url));
const target = fileURLToPath(new URL("../.env.local", import.meta.url));

const status = JSON.parse(
  execSync("npx supabase status -o json", {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }),
);

const url = status.API_URL;
const key = status.PUBLISHABLE_KEY;
if (!url || !key) {
  throw new Error("O banco local não respondeu. Abra o Docker e rode `npx supabase start` na raiz.");
}

writeFileSync(
  target,
  `NEXT_PUBLIC_SUPABASE_URL=${url}\nNEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${key}\n`,
);
console.log("web/.env.local criado.");
