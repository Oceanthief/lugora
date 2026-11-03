import { strings } from "@/content/pt-BR";
import { formatRating } from "@/lib/format";

/** A nota numa pílula âmbar. Leitores de tela ouvem "Nota 4,5". */
export function RatingPill({ rating }: { rating: number }) {
  return (
    <span className="rounded-control bg-accent px-2.5 py-0.5 text-sm font-semibold text-on-accent">
      <span className="sr-only">{strings.ratingLabel} </span>
      {formatRating(rating)}
    </span>
  );
}
