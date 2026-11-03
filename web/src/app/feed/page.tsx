import type { Metadata } from "next";

import { PlaceSummary } from "@/components/place-summary";
import { RatingPill } from "@/components/rating-pill";
import { strings } from "@/content/pt-BR";
import { formatVisitDate } from "@/lib/format";
import { getFeed } from "@/lib/mock-data";

const text = strings.feed;

export const metadata: Metadata = { title: text.title };

export default function FeedPage() {
  const items = getFeed();

  return (
    <section className="mx-auto max-w-md px-4 py-6">
      <h1 className="text-2xl font-semibold">{text.title}</h1>
      <p className="mt-1 text-ink-muted">{text.subtitle}</p>

      {items.length === 0 ? (
        <p className="mt-6 rounded-card bg-surface p-4 text-ink-muted">{text.empty}</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {items.map(({ visit, user, place, city }) => (
            <li key={visit.id} className="rounded-card bg-surface p-4">
              <p className="flex items-baseline justify-between gap-2 text-sm">
                <span>
                  <span className="font-semibold">{user.name}</span>{" "}
                  <span className="text-ink-muted">{text.visited}</span>
                </span>
                <time dateTime={visit.visitedOn} className="shrink-0 text-ink-muted">
                  {formatVisitDate(visit.visitedOn)}
                </time>
              </p>

              <div className="mt-3">
                <PlaceSummary place={place} city={city} />
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <RatingPill rating={visit.rating} />
                {visit.occasions.map((occasion) => (
                  <span
                    key={occasion}
                    className="rounded-control bg-glow px-3 py-0.5 text-sm font-medium text-on-glow"
                  >
                    {strings.occasions[occasion]}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
