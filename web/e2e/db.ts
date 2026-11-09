import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Só para preparar e limpar os testes, no banco LOCAL (na máquina ou na CI):
 * usa o psql de dentro do container do Supabase local, sem senha nem chave.
 * Nunca aponta para a nuvem. O app em si nunca faz isso.
 */
export function runSql(sql: string): string {
  return execFileSync(
    "docker",
    ["exec", "-i", "supabase_db_lugora", "psql", "-U", "postgres", "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-q", "-t", "-A"],
    { input: sql, encoding: "utf8" },
  ).trim();
}

/** Os npm scripts rodam em web/; a pasta supabase/ fica ao lado. */
export function readFixture(name: string): string {
  return readFileSync(join(process.cwd(), "..", "supabase", "fixtures", name), "utf8");
}

/** Todo e-mail criado pelos testes começa assim, para a limpeza achar só eles. */
export const TEST_EMAIL_PREFIX = "e2e-";
