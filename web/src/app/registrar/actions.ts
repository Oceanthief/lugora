"use server";

import { isValidPosition, PLACE_SEARCH_MIN_LENGTH, toPlaceResult, type PlaceResult, type Position } from "@/lib/places";
import { hasProfile } from "@/lib/supabase/profile";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/session";

export type PlaceSearchResult = { places: PlaceResult[]; failed: boolean; sessionChanged?: boolean };

/**
 * A posição vai no corpo do pedido, nunca na URL, e só serve para calcular a
 * distância: nada guarda onde a pessoa estava (seção 9.1). A função do banco
 * confere o consentimento e ignora a posição de quem não deu.
 */
export async function searchPlaces(
  query: string,
  position: Position | null,
  screenUserId: string,
): Promise<PlaceSearchResult> {
  if (query.trim().length < PLACE_SEARCH_MIN_LENGTH) return { places: [], failed: false };

  const user = await getCurrentUser();
  // Uma aba antiga pode guardar a posição de quem já saiu da conta, e ela não vale para a sessão de
  // agora. Isto só confere se a tela e a sessão são da mesma pessoa: quem autoriza continua sendo a sessão.
  if (!user || user.id !== screenUserId) return { places: [], failed: true, sessionChanged: true };

  // A tela já manda para o cadastro, mas esta ação também pode ser chamada direto: sem cadastro, não há 18+ declarado.
  if (!(await hasProfile(user.id))) return { places: [], failed: true };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_places", {
    p_query: query,
    ...(position && isValidPosition(position)
      ? { p_latitude: position.latitude, p_longitude: position.longitude }
      : {}),
  });
  return { places: (data ?? []).map(toPlaceResult), failed: Boolean(error) };
}
