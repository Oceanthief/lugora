import "server-only";

import { hasSupabaseEnv } from "./config";
import { createClient } from "./server";

export type MyProfile = {
  name: string;
  username: string;
  homeCity: { name: string; state: string | null } | null;
};

/** Sem perfil, a pessoa entrou mas ainda não concluiu o cadastro. */
export async function hasProfile(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("id").eq("id", userId).maybeSingle();
  return data !== null;
}

/**
 * O perfil de quem está logado. A cidade vem de profiles_private, que o RLS só
 * entrega ao dono: esta função não serve para ver a cidade de outra pessoa.
 */
export async function getMyProfile(userId: string): Promise<MyProfile | null> {
  const supabase = await createClient();
  const [{ data: profile }, { data: privateData }] = await Promise.all([
    supabase.from("profiles").select("name, username").eq("id", userId).maybeSingle(),
    // Só nome e UF: o polígono da cidade é pesado e aqui não serve para nada.
    supabase.from("profiles_private").select("cities(name, state)").eq("user_id", userId).maybeSingle(),
  ]);
  if (!profile) return null;

  return { name: profile.name, username: profile.username, homeCity: privateData?.cities ?? null };
}

/** A versão da política vem do banco, a mesma registrada em cada consentimento. */
export async function getPrivacyPolicyVersion(): Promise<string | null> {
  if (!hasSupabaseEnv()) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("app_parameters")
    .select("value")
    .eq("key", "privacy_policy_version")
    .maybeSingle();
  return typeof data?.value === "string" ? data.value : null;
}
