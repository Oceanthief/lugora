import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { signOut } from "@/app/entrar/actions";
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
import { getCurrentUser } from "@/lib/supabase/session";

const text = strings.profile;

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export const metadata: Metadata = { title: text.title };

export default function ProfilePage() {
  return (
    <section className="mx-auto max-w-md px-4 py-6">
      {/* A sessão vem dos cookies do pedido; por isso esta parte fica no Suspense. */}
      <Suspense fallback={<p className="text-ink-muted">{text.loading}</p>}>
        <ProfileContent />
      </Suspense>
    </section>
  );
}

async function ProfileContent() {
  const user = await getCurrentUser();
  if (!user) return <SignedOut />;

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
    <>
      <div className="mb-6 rounded-card bg-surface p-4">
        <p className="font-medium break-words">{text.signedInAs(user.email)}</p>
        <p className="mt-1 text-sm text-ink-muted">{text.demoNotice}</p>
        <form action={signOut} className="mt-3">
          <button
            type="submit"
            className={`min-h-11 rounded-control border border-line px-4 text-sm font-semibold ${focusRing}`}
          >
            {text.signOut}
          </button>
        </form>
      </div>

      <div className="flex items-center gap-4">
        <span
          aria-hidden="true"
          className="flex size-16 shrink-0 items-center justify-center rounded-full bg-accent text-2xl font-semibold text-on-accent"
        >
          {mockProfile.name.charAt(0)}
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold">{mockProfile.name}</h1>
          <p className="text-ink-muted">@{mockProfile.username}</p>
          {homeCity ? (
            // A cidade de residência é privada (seção 9.3): aparece só no
            // próprio perfil, com o aviso.
            <p className="text-sm text-ink-muted">{text.homeCity(homeCity.name)}</p>
          ) : null}
        </div>
      </div>

      <h2 className="sr-only">{text.statsLabel}</h2>
      <dl className="mt-6 grid grid-cols-2 gap-3">
        {numbers.map(({ label, value, detail }) => (
          <div key={label} className="rounded-card bg-surface p-4">
            <dt className="text-sm text-ink-muted">{label}</dt>
            <dd className="text-3xl font-semibold">{value}</dd>
            {detail ? <dd className="mt-1 text-sm text-ink-muted">{detail}</dd> : null}
          </div>
        ))}
      </dl>

      <div className="mt-3 rounded-card bg-glow p-4 text-on-glow">
        <h2 className="font-semibold">{text.travelerTitle}</h2>
        <p className="mt-1">{travelText(describeTravel(stats), homeCity?.name)}</p>
      </div>
    </>
  );
}

function SignedOut() {
  return (
    <div className="flex flex-col items-start gap-4">
      <h1 className="text-2xl font-semibold">{text.signedOutTitle}</h1>
      <p className="text-ink-muted">{text.signedOutText}</p>
      <Link
        href="/entrar"
        className={`flex min-h-12 items-center rounded-control bg-accent px-6 font-semibold text-on-accent ${focusRing}`}
      >
        {text.signIn}
      </Link>
    </div>
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
