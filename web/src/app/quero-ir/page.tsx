import type { Metadata } from "next";

import { PlaceSummary } from "@/components/place-summary";
import { strings } from "@/content/pt-BR";
import { formatSourceHost, formatVisitDate } from "@/lib/format";
import { getWantToGo } from "@/lib/mock-data";

const text = strings.wantToGo;

export const metadata: Metadata = { title: text.title };

export default function WantToGoPage() {
  const entries = getWantToGo();

  return (
    <section className="mx-auto max-w-md px-4 py-6">
      <h1 className="text-2xl font-semibold">{text.title}</h1>
      <p className="mt-1 text-zinc-600 dark:text-zinc-400">{text.subtitle}</p>

      <ul className="mt-6 flex flex-col gap-3">
        {entries.map(({ item, place, city }) => (
          <li
            key={item.id}
            className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
          >
            <PlaceSummary place={place} city={city} />
            <div className="mt-3 flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-400">
              {/* Por enquanto só o site; o link de verdade vem com o banco. */}
              {item.sourceUrl ? (
                <span>{text.seenOn(formatSourceHost(item.sourceUrl))}</span>
              ) : null}
              <span>{text.addedOn(formatVisitDate(item.addedOn))}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
