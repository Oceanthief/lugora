import { occasions, type Occasion } from "./occasions";

/**
 * Ocasiões por visita (seção 7.8). O valor que vale vem do banco
 * (`visit_max_tags`); este é só o padrão, se o parâmetro não chegar.
 */
export const DEFAULT_MAX_OCCASIONS = 3;

/** Notas possíveis: de 0,5 a 5, em passos de 0,5 (seção 7.1). */
export const RATING_OPTIONS: readonly number[] = Array.from(
  { length: 10 },
  (_, i) => (i + 1) / 2,
);

/** Quem pode ver a visita (seção 7.5). "private" é o "só eu". */
export const VISIBILITY_OPTIONS = ["public", "followers", "private"] as const;
export type Visibility = (typeof VISIBILITY_OPTIONS)[number];

export function isVisibility(value: unknown): value is Visibility {
  return (VISIBILITY_OPTIONS as readonly unknown[]).includes(value);
}

/** O que a pessoa preencheu no registro rápido, antes de salvar. */
export type VisitDraft = {
  placeId: string;
  /** AAAA-MM-DD. */
  visitedOn: string;
  rating: number | null;
  occasions: readonly Occasion[];
  /**
   * null quando a pessoa não mexeu: aí o banco aplica o padrão, e lugar
   * sensível nasce "só eu" mesmo que a tela erre.
   */
  visibility: Visibility | null;
};

export type VisitDraftError =
  | "placeRequired"
  | "placeUnavailable"
  | "dateRequired"
  | "dateInFuture"
  | "ratingRequired"
  | "ratingInvalid"
  | "tooManyOccasions";

export type VisitDraftErrors = Partial<Record<keyof VisitDraft, VisitDraftError>>;

/**
 * Confere as regras da seção 7.1: lugar, data e nota são obrigatórios, a data
 * não pode ser futura e a nota vai de 0,5 a 5. Devolve um código por campo
 * com problema; os textos ficam em pt-BR.ts. O banco confere tudo de novo.
 */
export function validateVisitDraft(
  draft: VisitDraft,
  today: string,
  maxOccasions = DEFAULT_MAX_OCCASIONS,
): VisitDraftErrors {
  const errors: VisitDraftErrors = {};

  if (!draft.placeId) errors.placeId = "placeRequired";

  if (!draft.visitedOn) errors.visitedOn = "dateRequired";
  // Datas AAAA-MM-DD podem ser comparadas como texto.
  else if (draft.visitedOn > today) errors.visitedOn = "dateInFuture";

  if (draft.rating === null) errors.rating = "ratingRequired";
  else if (!RATING_OPTIONS.includes(draft.rating)) errors.rating = "ratingInvalid";

  if (draft.occasions.length > maxOccasions) errors.occasions = "tooManyOccasions";

  return errors;
}

/** Marca ou desmarca uma ocasião, sem passar do limite. */
export function toggleOccasion(
  selected: readonly Occasion[],
  occasion: Occasion,
  maxOccasions = DEFAULT_MAX_OCCASIONS,
): readonly Occasion[] {
  if (selected.includes(occasion)) {
    return selected.filter((item) => item !== occasion);
  }
  if (selected.length >= maxOccasions) return selected;
  return [...selected, occasion];
}

/**
 * A visibilidade que a tela mostra marcada enquanto a pessoa não escolhe:
 * a mesma regra do banco. Lugar sensível nasce "só eu" (seção 7.5).
 */
export function defaultVisibilityFor(
  place: { isSensitive: boolean } | null,
  profileDefault: Visibility,
): Visibility {
  return place?.isSensitive ? "private" : profileDefault;
}

/**
 * O banco confere as regras de novo e recusa com um código (create_visit).
 * Os que a pessoa consegue corrigir voltam para o campo certo; o resto vira
 * "não conseguimos salvar".
 */
export function visitErrorsFromDatabase(message: string | undefined): VisitDraftErrors | null {
  switch (message) {
    case "place_not_found":
    case "place_not_visitable":
      return { placeId: "placeUnavailable" };
    case "visited_on_in_future":
      return { visitedOn: "dateInFuture" };
    case "too_many_tags":
      return { occasions: "tooManyOccasions" };
    default:
      return null;
  }
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}

/**
 * A Server Action recebe o rascunho pela rede, e qualquer um pode mandar
 * qualquer coisa. Devolve o rascunho só se cada campo tiver o tipo certo; as
 * regras (data futura, nota, limite) ficam com validateVisitDraft e o banco.
 */
export function parseVisitDraft(input: unknown): VisitDraft | null {
  if (typeof input !== "object" || input === null) return null;
  const raw = input as Record<string, unknown>;

  if (!isUuid(raw.placeId)) return null;
  if (typeof raw.visitedOn !== "string" || !ISO_DATE.test(raw.visitedOn)) return null;
  if (typeof raw.rating !== "number") return null;
  if (!Array.isArray(raw.occasions)) return null;
  if (!raw.occasions.every((item) => (occasions as readonly unknown[]).includes(item))) return null;
  if (raw.visibility !== null && !isVisibility(raw.visibility)) return null;

  return {
    placeId: raw.placeId,
    visitedOn: raw.visitedOn,
    rating: raw.rating,
    occasions: [...new Set(raw.occasions as Occasion[])],
    visibility: raw.visibility,
  };
}
