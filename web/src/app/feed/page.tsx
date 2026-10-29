import type { Metadata } from "next";

import { PlaceSummary } from "@/components/place-summary";
import { strings } from "@/content/pt-BR";
import { formatRating, formatVisitDate } from "@/lib/format";
import { getFeed } from "@/lib/mock-data";

const text = strings.feed;

export const metadata: Metadata = { title: text.title };

export default function FeedPage() {
  const items = getFeed();

  return (
    <section className="mx-auto max-w-md px-4 py-6">
      <h1 className="text-2xl font-semibold">{text.title}</h1>
      <p className="mt-1 text-zinc-600 dark:text-zinc-400">{text.subtitle}</p>

      <ul className="mt-6 flex flex-col gap-3">
        {items.map(({ visit, user, place, city }) => (
          <li
            key={visit.id}
            className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
          >
            <p className="flex justify-between gap-2 text-sm">
              <span>
                <span className="font-semibold">{user.name}</span>{" "}
                <span className="text-zinc-600 dark:text-zinc-400">
                  {text.visited}
                </span>
              </span>
              <time
                dateTime={visit.visitedOn}
                className="shrink-0 text-zinc-600 dark:text-zinc-400"
              >
                {formatVisitDate(visit.visitedOn)}
              </time>
            </p>

            <div className="mt-3">
              <PlaceSummary place={place} city={city} />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <span className="font-semibold">
                {strings.rating(formatRating(visit.rating))}
              </span>
              {visit.occasions.map((occasion) => (
                <span
                  key={occasion}
                  className="rounded-full bg-zinc-100 px-3 py-1 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  {strings.occasions[occasion]}
                </span>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
