/** Endereço e chave pública do Supabase. A chave service_role não existe neste app. */
export function hasSupabaseEnv(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

export function supabaseEnv(): { url: string; publishableKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) {
    throw new Error("Faltam as variáveis do Supabase. Rode `npm run env:local` em web/.");
  }
  return { url, publishableKey };
}

/**
 * httpOnly: o JavaScript da página não lê a sessão, então um script malicioso
 * não consegue roubá-la. Funciona porque o login acontece só no servidor
 * (ADR 0009).
 */
export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
} as const;
