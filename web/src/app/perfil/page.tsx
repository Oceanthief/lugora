import type { Metadata } from "next";

import { strings } from "@/content/pt-BR";
import { formatCountryName } from "@/lib/format";
import {
  getCity,
  mockCities,
  mockPlaces,
  mockProfile,
  mockVisits,
} from "@/lib/mock-data";
import { computeProfileStats, describeTravel, type TravelSummary } from "@/lib/stats";

const text = strings.profile;

export const metadata: Metadata = { title: text.title };

export default function ProfilePage() {
  const stats = computeProfileStats({
    visits: mockVisits,
    places: mockPlaces,
    cities: mockCities,
    homeCityId: mockProfile.homeCityId,
  });
  const homeCity = getCity(mockProfile.homeCityId);
  const countryNames = stats.countryCodes.map(formatCountryName).join(", ");
  const cityNames = stats.cityIds
    .map((id) => getCity(id)?.name ?? id)
    .sort((a, b) => a.localeCompare(b, "pt-BR"))
    .join(", ");

  const numbers = [
    { label: text.countries, value: stats.countryCodes.length, detail: countryNames },
    { label: text.cities, value: stats.cityIds.length, detail: cityNames },
    { label: text.places, value: stats.places },
    { label: text.visits, value: stats.visits },
  ];

  return (
    <section className="mx-auto max-w-md px-4 py-6">
      <div className="flex items-center gap-4">
        <span
          aria-hidden="true"
          className="flex size-16 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xl font-semibold text-white dark:bg-zinc-100 dark:text-zinc-950"
        >
          {mockProfile.name.charAt(0)}
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold">{mockProfile.name}</h1>
          <p className="text-zinc-600 dark:text-zinc-400">@{mockProfile.username}</p>
          {homeCity ? (
            // A cidade de residência é privada (seção 9.3): aparece só no
            // próprio perfil, com o aviso.
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {text.homeCity(homeCity.name)} · {text.onlyYou}
            </p>
          ) : null}
        </div>
      </div>

      <h2 className="sr-only">{text.statsLabel}</h2>
      <dl className="mt-6 grid grid-cols-2 gap-3">
        {numbers.map(({ label, value, detail }) => (
          <div
            key={label}
            className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
          >
            <dt className="text-sm text-zinc-600 dark:text-zinc-400">{label}</dt>
            <dd className="text-3xl font-semibold">{value}</dd>
            {detail ? (
              <dd className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {detail}
              </dd>
            ) : null}
          </div>
        ))}
      </dl>

      <div className="mt-3 rounded-xl bg-zinc-100 p-4 dark:bg-zinc-900">
        <h2 className="font-semibold">{text.travelerTitle}</h2>
        <p className="mt-1 text-zinc-700 dark:text-zinc-300">
          {travelText(describeTravel(stats), homeCity?.name)}
        </p>
      </div>
    </section>
  );
}

function travelText(summary: TravelSummary, homeCityName = "sua cidade"): string {
  switch (summary.kind) {
    case "locked":
      return text.travelShareLocked(summary.missing);
    case "none":
      return text.travelShareNone(homeCityName);
    case "underOne":
      return text.travelShareUnderOne;
    case "share":
      return text.travelShare(summary.percent);
  }
}
