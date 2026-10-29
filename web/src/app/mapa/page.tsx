import type { Metadata } from "next";

import { VisitMap } from "@/components/visit-map";
import { strings } from "@/content/pt-BR";
import { formatRating, formatVisitDate } from "@/lib/format";
import { getVisitedPlaces } from "@/lib/mock-data";

const text = strings.map;

export const metadata: Metadata = { title: text.title };

export default function MapPage() {
  const places = getVisitedPlaces();

  return (
    <section className="h-full">
      <h1 className="sr-only">{text.title}</h1>
      <VisitMap places={places} />

      {/* Alternativa em lista para leitores de tela (seção 13). */}
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
    </section>
  );
}
