import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { SignInPrompt } from "@/components/sign-in-prompt";
import { SignOutButton } from "@/components/sign-out-button";
import { strings } from "@/content/pt-BR";
import { computeProfileStats, describeTravel, type TravelSummary } from "@/lib/stats";
import { getMyProfile } from "@/lib/supabase/profile";
import { getCurrentUser } from "@/lib/supabase/session";
import { getMyVisitedPlaces } from "@/lib/supabase/visits";

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
  if (!user) return <SignInPrompt title={text.signedOutTitle} text={text.signedOutText} action={text.signIn} />;

  const profile = await getMyProfile(user.id);
  if (!profile) redirect("/cadastro");

  const homeCity = profile.homeCity;
  const homeCityLabel = homeCity
    ? homeCity.state
      ? `${homeCity.name}, ${homeCity.state}`
      : homeCity.name
    : undefined;

  // Só as visitas da própria pessoa: é ela quem está vendo, então todas contam,
  // inclusive as "só eu" e as que ainda não apareceram para os outros (seção 9.3).
  const stats = computeProfileStats(await getMyVisitedPlaces());

  const numbers = [
    { label: text.countries, value: stats.countryCodes.length },
    { label: text.cities, value: stats.cityIds.length },
    { label: text.places, value: stats.places },
    { label: text.visits, value: stats.visits },
  ];

  return (
    <>
      <div className="flex items-center gap-4">
        <span
          aria-hidden="true"
          className="flex size-16 shrink-0 items-center justify-center rounded-full bg-accent text-2xl font-semibold text-on-accent"
        >
          {profile.name.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold">{profile.name}</h1>
          <p className="text-ink-muted">@{profile.username}</p>
          {homeCityLabel ? (
            // A cidade de residência é privada (seção 9.3): aparece só no
            // próprio perfil, com o aviso.
            <p className="text-sm text-ink-muted">{text.homeCity(homeCityLabel)}</p>
          ) : null}
        </div>
      </div>

      <h2 className="sr-only">{text.statsLabel}</h2>
      <dl className="mt-6 grid grid-cols-2 gap-3">
        {numbers.map(({ label, value }) => (
          <div key={label} className="rounded-card bg-surface p-4">
            <dt className="text-sm text-ink-muted">{label}</dt>
            <dd className="text-3xl font-semibold">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-3 rounded-card bg-glow p-4 text-on-glow">
        <h2 className="font-semibold">{text.travelerTitle}</h2>
        <p className="mt-1">{travelText(describeTravel(stats), homeCity?.name)}</p>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <div className="min-w-0">
          <p className="text-sm break-words text-ink-muted">{text.signedInAs(user.email)}</p>
          <Link href="/privacidade" className="mt-1 inline-block text-sm font-semibold underline">
            {text.privacyLink}
          </Link>
        </div>
        <SignOutButton
          label={text.signOut}
          className={`min-h-11 rounded-control border border-line px-4 text-sm font-semibold ${focusRing}`}
        />
      </div>
    </>
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
