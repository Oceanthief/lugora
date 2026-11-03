import type { Metadata } from "next";
import Link from "next/link";

import { VisitMap } from "@/components/visit-map";
import { strings } from "@/content/pt-BR";
import { formatRating, formatVisitDate } from "@/lib/format";
import { getVisitedPlaces } from "@/lib/mock-data";

const text = strings.map;

export const metadata: Metadata = { title: text.title };

export default function MapPage() {
  const places = getVisitedPlaces();

  return (
    // Ocupa a tela inteira, por baixo da barra que flutua (direção C).
    <section className="absolute inset-0">
      <h1 className="sr-only">{text.title}</h1>
      <VisitMap places={places} />

      {/* O mapa é pessoal: só mostra os lugares visitados (seção 7.4). */}
      {places.length === 0 ? (
        <div className="absolute inset-x-4 bottom-[calc(6.5rem+env(safe-area-inset-bottom))] mx-auto max-w-sm rounded-card border border-line bg-surface p-4">
          <h2 className="font-semibold">{text.emptyTitle}</h2>
          <p className="mt-1 text-sm text-ink-muted">{text.emptyText}</p>
          <Link
            href="/registrar"
            className="mt-3 flex min-h-11 items-center justify-center rounded-control bg-accent px-4 text-sm font-semibold text-on-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {text.emptyAction}
          </Link>
        </div>
      ) : (
        // Alternativa em lista para leitores de tela (seção 13).
        <div className="sr-only">
          <h2>{text.placesList}</h2>
          <ul>
            {places.map((place) => (
              <li key={place.id}>
                {place.name}, {strings.categories[place.category]},{" "}
                {strings.rating(formatRating(place.rating))},{" "}
                {text.visitedOn(formatVisitDate(place.visitedOn))}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
