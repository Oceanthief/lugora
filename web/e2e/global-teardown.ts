import { runSql, TEST_EMAIL_PREFIX } from "./db";

/** Depois de tudo: apaga as contas criadas pelos testes. Visitas, viagens e consentimentos vão junto. */
export default function globalTeardown() {
  runSql(`delete from auth.users where email like '${TEST_EMAIL_PREFIX}%@example.com';`);
}
