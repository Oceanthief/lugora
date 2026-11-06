import "server-only";

import { toSaoPauloDate } from "@/lib/format";
import { DEFAULT_CITY_LEVELS, isLevelList } from "@/lib/map-levels";
import { DEFAULT_MAX_OCCASIONS, isVisibility, type Visibility } from "@/lib/visit-draft";
import { toMyVisitedPlace, type MyVisitedPlace } from "@/lib/visited-places";

import { createClient } from "./server";

export type VisitSettings = {
  /** O padrão do perfil (seção 7.5). Lugar sensível nasce "só eu" de todo jeito. */
  defaultVisibility: Visibility;
  maxOccasions: number;
};

export async function getVisitSettings(userId: string): Promise<VisitSettings> {
  const supabase = await createClient();
  const [{ data: profile }, { data: parameter }] = await Promise.all([
    supabase.from("profiles_private").select("default_visibility").eq("user_id", userId).maybeSingle(),
    supabase.from("app_parameters").select("value").eq("key", "visit_max_tags").maybeSingle(),
  ]);
  return {
    defaultVisibility: isVisibility(profile?.default_visibility) ? profile.default_visibility : "public",
    maxOccasions: typeof parameter?.value === "number" ? parameter.value : DEFAULT_MAX_OCCASIONS,
  };
}

/**
 * Os lugares do mapa de quem está logado. A função do banco só devolve as
 * visitas da própria sessão: não há como pedir o mapa de outra pessoa.
 */
export async function getMyVisitedPlaces(): Promise<MyVisitedPlace[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_visited_places");
  if (error) throw new Error("Não conseguimos carregar as visitas.", { cause: error });
  return (data ?? []).map(toMyVisitedPlace);
}

/** As faixas de cor do mapa (seção 7.4), de app_parameters. */
export async function getCityLevels(): Promise<readonly number[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("app_parameters").select("value").eq("key", "map_city_levels").maybeSingle();
  return isLevelList(data?.value) ? data.value : DEFAULT_CITY_LEVELS;
}

/**
 * A viagem aberta de quem está logado, se houver. O RLS só entrega as viagens
 * da própria pessoa. Devolve só a data em que ela acaba sozinha, nunca a hora.
 */
export async function getOpenTrip(): Promise<{ id: string; closesOn: string } | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("trips")
    .select("id, closes_at")
    .gt("closes_at", new Date().toISOString())
    .order("closes_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ? { id: data.id, closesOn: toSaoPauloDate(data.closes_at) } : null;
}
