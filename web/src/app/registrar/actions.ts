"use server";

import { refresh } from "next/cache";

import { isValidPosition, PLACE_SEARCH_MIN_LENGTH, toPlaceResult, type PlaceResult, type Position } from "@/lib/places";
import { hasProfile } from "@/lib/supabase/profile";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, type CurrentUser } from "@/lib/supabase/session";
import { getOpenTrip, getVisitSettings } from "@/lib/supabase/visits";
import {
  isUuid,
  isVisibility,
  parseVisitDraft,
  validateVisitDraft,
  visitErrorsFromDatabase,
  type Visibility,
  type VisitDraftErrors,
} from "@/lib/visit-draft";

export type PlaceSearchResult = { places: PlaceResult[]; failed: boolean; sessionChanged?: boolean };

/**
 * Toda Server Action pode ser chamada direto, sem a tela. Cada uma confere a
 * sessão e, como a tela fica viva na memória mesmo depois de outra pessoa
 * entrar, também se a tela é da mesma pessoa da sessão. Quem autoriza
 * continua sendo a sessão; o id da tela só serve para recusar.
 */
async function signedUpUser(
  screenUserId: string,
): Promise<{ user: CurrentUser } | { sessionChanged: true } | { failed: true }> {
  const user = await getCurrentUser();
  if (!user || user.id !== screenUserId) return { sessionChanged: true };
  // Sem cadastro, não há 18+ declarado.
  if (!(await hasProfile(user.id))) return { failed: true };
  return { user };
}

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

  const session = await signedUpUser(screenUserId);
  if (!("user" in session)) return { places: [], failed: true, ...session };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_places", {
    p_query: query,
    ...(position && isValidPosition(position)
      ? { p_latitude: position.latitude, p_longitude: position.longitude }
      : {}),
  });
  return { places: (data ?? []).map(toPlaceResult), failed: Boolean(error) };
}

/**
 * "Perto de você": com o GPS ligado e nada digitado. Mesmas regras da distância
 * na busca: a posição vai no corpo do pedido, ninguém a guarda, e o banco só
 * responde para quem deu o consentimento. O raio e a quantidade ficam no banco.
 */
export async function nearbyPlaces(position: Position, screenUserId: string): Promise<PlaceSearchResult> {
  // Toda Server Action recebe qualquer coisa: a posição pode nem ser um objeto.
  if (typeof position !== "object" || position === null || !isValidPosition(position)) {
    return { places: [], failed: true };
  }

  const session = await signedUpUser(screenUserId);
  if (!("user" in session)) return { places: [], failed: true, ...session };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("nearby_places", {
    p_latitude: position.latitude,
    p_longitude: position.longitude,
  });
  return { places: (data ?? []).map(toPlaceResult), failed: Boolean(error) };
}

export type SavedVisit = {
  id: string;
  visibility: Visibility;
  /** AAAA-MM-DD: o dia em que a visita aparece para os outros. Nunca a hora. */
  publishOn: string;
  /** Visita fora da cidade de residência: aparece quando a viagem acaba. */
  tripId: string | null;
};

export type SaveVisitResult =
  | { ok: true; visit: SavedVisit }
  | { ok: false; errors: VisitDraftErrors; failed?: boolean; sessionChanged?: boolean };

export async function saveVisit(input: unknown, screenUserId: string): Promise<SaveVisitResult> {
  const session = await signedUpUser(screenUserId);
  if (!("user" in session)) return { ok: false, errors: {}, ...session };

  const draft = parseVisitDraft(input);
  if (!draft || draft.rating === null) return { ok: false, errors: {}, failed: true };

  const { maxOccasions } = await getVisitSettings(session.user.id);
  // O servidor não sabe o fuso do aparelho. A data futura fica com o banco,
  // que aceita até o "hoje" do fuso mais adiantado do mundo.
  const errors = validateVisitDraft(draft, "9999-12-31", maxOccasions);
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_visit", {
    p_place_id: draft.placeId,
    p_visited_on: draft.visitedOn,
    p_rating: draft.rating,
    p_tag_ids: [...draft.occasions],
    // Sem escolha, o banco aplica o padrão: lugar sensível nasce "só eu".
    ...(draft.visibility ? { p_visibility: draft.visibility } : {}),
  });

  const row = data?.[0];
  if (error || !row || !isVisibility(row.visibility)) {
    const fieldErrors = visitErrorsFromDatabase(error?.message);
    return fieldErrors ? { ok: false, errors: fieldErrors } : { ok: false, errors: {}, failed: true };
  }

  // A API não diz se a visita entrou numa viagem (is_resident e trip_id não saem). A regra é a do
  // banco: fora da cidade de residência, ela entra na viagem aberta.
  const [{ data: place }, { data: home }, openTrip] = await Promise.all([
    supabase.from("places").select("city_id").eq("id", draft.placeId).maybeSingle(),
    supabase.from("profiles_private").select("home_city_id").eq("user_id", session.user.id).maybeSingle(),
    getOpenTrip(),
  ]);
  const away = place !== null && home !== null && place.city_id !== home.home_city_id;

  // Os números do perfil e o mapa mudaram.
  refresh();

  return {
    ok: true,
    visit: {
      id: row.id,
      visibility: row.visibility,
      publishOn: row.publish_on,
      tripId: away ? (openTrip?.id ?? null) : null,
    },
  };
}

export type PublishResult =
  | { ok: true; publishOn: string }
  | { ok: false; failed?: boolean; sessionChanged?: boolean };

/** "Publicar agora" (seção 7.5). O banco só deixa antecipar a própria visita. */
export async function publishVisitNow(visitId: string, screenUserId: string): Promise<PublishResult> {
  const session = await signedUpUser(screenUserId);
  if (!("user" in session)) return { ok: false, ...session };
  if (!isUuid(visitId)) return { ok: false, failed: true };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("publish_visit_now", { p_visit_id: visitId });
  if (error || typeof data !== "string") return { ok: false, failed: true };

  refresh();
  return { ok: true, publishOn: data };
}

export type CloseTripResult = { ok: true } | { ok: false; failed?: boolean; sessionChanged?: boolean };

/** "Encerrar viagem": as visitas dela aparecem agora. O banco só deixa encerrar a própria. */
export async function closeTrip(tripId: string, screenUserId: string): Promise<CloseTripResult> {
  const session = await signedUpUser(screenUserId);
  if (!("user" in session)) return { ok: false, ...session };
  if (!isUuid(tripId)) return { ok: false, failed: true };

  const supabase = await createClient();
  const { error } = await supabase.rpc("close_trip", { p_trip_id: tripId });
  if (error) return { ok: false, failed: true };

  refresh();
  return { ok: true };
}
