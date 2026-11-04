import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

/**
 * Regra inegociável: a chave service_role ignora o RLS e nunca existe no app.
 * Testes ficam de fora, porque citam os nomes para procurá-los.
 */
const SRC = fileURLToPath(new URL("../../", import.meta.url));
const ENV_EXAMPLE = fileURLToPath(new URL("../../../.env.example", import.meta.url));
const SECRET = /service[_-]?role|sb_secret|SUPABASE_SECRET/i;

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name) ? [path] : [];
  });
}

describe("nenhuma chave secreta no app", () => {
  it("a regra pega os nomes das chaves secretas", () => {
    for (const bad of ["SUPABASE_SERVICE_ROLE_KEY", "service_role", "sb_secret_abc"]) {
      expect(SECRET.test(bad), bad).toBe(true);
    }
  });

  it("nenhum arquivo de src/ cita uma chave secreta", () => {
    const files = sourceFiles(SRC);
    expect(files.length).toBeGreaterThan(20);
    const found = files
      .filter((path) => {
        // Este arquivo de configuração explica a regra em comentário.
        const code = readFileSync(path, "utf8")
          .split("\n")
          .filter((line) => !/^\s*(\/\/|\/?\*)/.test(line))
          .join("\n");
        return SECRET.test(code);
      })
      .map((path) => relative(SRC, path));
    expect(found).toEqual([]);
  });

  it("o .env.example só tem as variáveis públicas", () => {
    const names = readFileSync(ENV_EXAMPLE, "utf8")
      .split("\n")
      .filter((line) => line.includes("=") && !line.startsWith("#"))
      .map((line) => line.split("=")[0]);
    expect(names).toEqual(["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"]);
  });
});
