import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";

import { sessionCookieOptions, supabaseEnv } from "./config";

/**
 * Cliente do Supabase com a sessão de quem fez o pedido: é ela que faz o RLS
 * valer. Crie um por pedido, nunca um compartilhado entre usuários.
 */
export async function createClient() {
  // A biblioteca lê o relógio ao ser criada. connection() avisa o Next de que
  // isto só roda com um pedido de verdade, nunca na pré-renderização.
  await connection();
  const cookieStore = await cookies();
  const { url, publishableKey } = supabaseEnv();

  return createServerClient(url, publishableKey, {
    cookieOptions: sessionCookieOptions,
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components não gravam cookies. Sem problema: o proxy renova
          // a sessão antes de cada página (src/proxy.ts).
        }
      },
    },
  });
}
