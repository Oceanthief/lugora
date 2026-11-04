import "server-only";

import { createClient } from "./server";

export type CurrentUser = {
  id: string;
  email: string;
};

/**
 * Quem está logado, ou null. Com o Cache Components ligado, só pode ser chamada
 * dentro de um <Suspense>, porque lê os cookies do pedido.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  // getClaims confere a assinatura do token. Nunca confie só no conteúdo do cookie.
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  return { id: claims.sub, email: typeof claims.email === "string" ? claims.email : "" };
}
