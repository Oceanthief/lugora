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
    <section className="relative h-full">
      <h1 className="sr-only">{text.title}</h1>
      <VisitMap places={places} />

      {/* O mapa é pessoal: só mostra os lugares visitados (seção 7.4). */}
      {places.length === 0 ? (
        <div className="absolute inset-x-4 bottom-14 mx-auto max-w-sm rounded-xl bg-white p-4 shadow-lg dark:bg-zinc-900">
          <h2 className="font-semibold">{text.emptyTitle}</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{text.emptyText}</p>
          <Link
            href="/registrar"
            className="mt-3 flex min-h-11 items-center justify-center rounded-full bg-zinc-950 px-4 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950 dark:bg-white dark:text-zinc-950"
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
