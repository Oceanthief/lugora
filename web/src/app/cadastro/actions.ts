"use server";

import { redirect } from "next/navigation";

import {
  CITY_SEARCH_MIN_LENGTH,
  keepOptionalPurposes,
  normalizeUsername,
  signupFailureFrom,
  validateSignup,
  type CityOption,
  type SignupDraft,
  type SignupState,
} from "@/lib/signup";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/session";

function draftFrom(formData: FormData): SignupDraft {
  return {
    name: String(formData.get("name") ?? ""),
    username: normalizeUsername(String(formData.get("username") ?? "")),
    cityId: String(formData.get("city_id") ?? ""),
    ageConfirmed: formData.get("age_confirmed") === "on",
    policyAccepted: formData.get("policy_accepted") === "on",
    grantedPurposes: keepOptionalPurposes(formData.getAll("purposes").map(String)),
  };
}

export async function completeSignup(_previous: SignupState, formData: FormData): Promise<SignupState> {
  // Toda Server Action confere a sessão por conta própria: a tela não garante nada.
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");

  const draft = draftFrom(formData);
  const errors = validateSignup(draft);
  if (Object.keys(errors).length > 0) return { errors, draft };

  const supabase = await createClient();
  const { error } = await supabase.rpc("complete_signup", {
    p_name: draft.name,
    p_username: draft.username,
    p_home_city_id: draft.cityId,
    p_age_confirmed: draft.ageConfirmed,
    p_policy_accepted: draft.policyAccepted,
    p_granted_purposes: draft.grantedPurposes,
  });

  if (error) {
    const failure = signupFailureFrom(error);
    if (failure.kind === "field") return { errors: failure.errors, draft };
    if (failure.kind === "failed") return { errors: {}, failed: true, draft };
    // failure.kind === "alreadySignedUp": segue para o perfil.
  }

  redirect("/perfil");
}

export type CitySearchResult = { cities: CityOption[]; failed: boolean };

export async function searchCities(query: string): Promise<CitySearchResult> {
  if (query.trim().length < CITY_SEARCH_MIN_LENGTH) return { cities: [], failed: false };
  if (!(await getCurrentUser())) return { cities: [], failed: true };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_cities", { p_query: query });
  return { cities: data ?? [], failed: Boolean(error) };
}
