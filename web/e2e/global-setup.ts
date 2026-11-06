import { readFixture, runSql } from "./db";

/** Antes de tudo: os lugares fictícios em que os testes registram visitas. */
export default function globalSetup() {
  try {
    runSql(readFixture("e2e_places.sql"));
  } catch (error) {
    throw new Error(
      "Não consegui preparar o banco local. Abra o Docker e rode `npx supabase start` na raiz do projeto.",
      { cause: error },
    );
  }
}
