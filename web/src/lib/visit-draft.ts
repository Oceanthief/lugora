import type { Occasion } from "./mock-data";

/** Ocasiões por visita (seção 7.8). */
export const MAX_OCCASIONS = 3;

/** Notas possíveis: de 0,5 a 5, em passos de 0,5 (seção 7.1). */
export const RATING_OPTIONS: readonly number[] = Array.from(
  { length: 10 },
  (_, i) => (i + 1) / 2,
);

/** O que a pessoa preencheu no registro rápido, antes de salvar. */
export type VisitDraft = {
  placeId: string;
  /** AAAA-MM-DD. */
  visitedOn: string;
  rating: number | null;
  occasions: readonly Occasion[];
};

export type VisitDraftError =
  | "placeRequired"
  | "dateRequired"
  | "dateInFuture"
  | "ratingRequired"
  | "ratingInvalid"
  | "tooManyOccasions";

export type VisitDraftErrors = Partial<Record<keyof VisitDraft, VisitDraftError>>;

/**
 * Confere as regras da seção 7.1: lugar, data e nota são obrigatórios, a data
 * não pode ser futura e a nota vai de 0,5 a 5. Devolve um código por campo
 * com problema; os textos ficam em pt-BR.ts.
 */
export function validateVisitDraft(
  draft: VisitDraft,
  today: string,
): VisitDraftErrors {
  const errors: VisitDraftErrors = {};

  if (!draft.placeId) errors.placeId = "placeRequired";

  if (!draft.visitedOn) errors.visitedOn = "dateRequired";
  // Datas AAAA-MM-DD podem ser comparadas como texto.
  else if (draft.visitedOn > today) errors.visitedOn = "dateInFuture";

  if (draft.rating === null) errors.rating = "ratingRequired";
  else if (!RATING_OPTIONS.includes(draft.rating)) errors.rating = "ratingInvalid";

  if (draft.occasions.length > MAX_OCCASIONS) errors.occasions = "tooManyOccasions";

  return errors;
}

/** Marca ou desmarca uma ocasião, sem passar do limite. */
export function toggleOccasion(
  selected: readonly Occasion[],
  occasion: Occasion,
): readonly Occasion[] {
  if (selected.includes(occasion)) {
    return selected.filter((item) => item !== occasion);
  }
  if (selected.length >= MAX_OCCASIONS) return selected;
  return [...selected, occasion];
}
