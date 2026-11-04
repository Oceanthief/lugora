"use server";

import { isValidPosition, PLACE_SEARCH_MIN_LENGTH, toPlaceResult, type PlaceResult, type Position } from "@/lib/places";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/session";

export type PlaceSearchResult = { places: PlaceResult[]; failed: boolean };

/**
 * A posição vai no corpo do pedido, nunca na URL, e só serve para calcular a
 * distância: nada guarda onde a pessoa estava (seção 9.1).
 */
export async function searchPlaces(query: string, position: Position | null): Promise<PlaceSearchResult> {
  if (query.trim().length < PLACE_SEARCH_MIN_LENGTH) return { places: [], failed: false };
  if (!(await getCurrentUser())) return { places: [], failed: true };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_places", {
    p_query: query,
    ...(position && isValidPosition(position)
      ? { p_latitude: position.latitude, p_longitude: position.longitude }
      : {}),
  });
  return { places: (data ?? []).map(toPlaceResult), failed: Boolean(error) };
}
