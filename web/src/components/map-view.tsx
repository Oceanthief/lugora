"use client";

// Client Component: a aba escolhida, a lista aberta e o "Encerrar viagem"
// mudam a tela na hora, no navegador. Os dados chegam prontos do servidor.

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";

import { closeTrip } from "@/app/registrar/actions";
import { CategoryIcon } from "@/components/category-icon";
import { RatingPill } from "@/components/rating-pill";
import { Confirmable } from "@/components/saved-visit";
import { VisitMap } from "@/components/visit-map";
import { strings } from "@/content/pt-BR";
import { categoryLabel } from "@/lib/category-label";
import { mapColors } from "@/lib/design-tokens";
import { formatVisitDate } from "@/lib/format";
import { levelRanges, placesInTab, summarizeCities, type CitySummary, type MapTab } from "@/lib/map-levels";
import type { MyVisitedPlace } from "@/lib/visited-places";

const text = strings.map;
const tripText = strings.register.saved;

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
const card = "pointer-events-auto rounded-card border border-line bg-surface p-4";

const TABS: readonly MapTab[] = ["home", "trips"];

export function MapView({
  userId,
  places,
  levels,
  openTrip,
}: {
  userId: string;
  places: readonly MyVisitedPlace[];
  levels: readonly number[];
  openTrip: { id: string; closesOn: string } | null;
}) {
  // Abre em Minha cidade, a não ser que só haja viagens.
  const [tab, setTab] = useState<MapTab>(() =>
    placesInTab(places, "home").length === 0 && placesInTab(places, "trips").length > 0 ? "trips" : "home",
  );
  const [showList, setShowList] = useState(false);

  // A faixa conta todos os lugares distintos da cidade (seção 7.4).
  const cities = useMemo(() => summarizeCities(places, levels), [places, levels]);
  const tabPlaces = useMemo(() => placesInTab(places, tab), [places, tab]);
  const tabCities = useMemo(() => {
    const ids = new Set(tabPlaces.map((place) => place.city.id));
    return cities.filter((city) => ids.has(city.id));
  }, [cities, tabPlaces]);

  return (
    <>
      <VisitMap places={tabPlaces} cities={tabCities} tab={tab} />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-2 p-4">
        <div role="group" aria-label={text.tabsLabel} className="pointer-events-auto flex rounded-control border border-line bg-surface p-1">
          {TABS.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={tab === option}
              onClick={() => setTab(option)}
              className={`min-h-11 rounded-control px-4 text-sm font-semibold text-ink aria-pressed:bg-glow aria-pressed:text-on-glow ${focusRing}`}
            >
              {text.tabs[option]}
            </button>
          ))}
        </div>
        {places.length > 0 ? (
          <button
            type="button"
            aria-expanded={showList}
            aria-controls="map-list"
            onClick={() => setShowList((open) => !open)}
            className={`pointer-events-auto min-h-11 shrink-0 rounded-control border border-line bg-surface px-4 text-sm font-semibold ${focusRing}`}
          >
            {showList ? text.showMap : text.showList}
          </button>
        ) : null}
      </div>

      {/* A alternativa em lista (seção 13): as mesmas cidades e lugares da aba, em texto. */}
      <div
        id="map-list"
        hidden={!showList}
        className="absolute inset-x-0 top-[4.75rem] bottom-0 z-10 overflow-y-auto bg-canvas px-4 pb-[calc(7rem+env(safe-area-inset-bottom))]"
      >
        <PlacesList tab={tab} places={tabPlaces} cities={tabCities} />
      </div>

      <div className="pointer-events-none absolute inset-x-4 bottom-[calc(6.5rem+env(safe-area-inset-bottom))] z-20 mx-auto flex max-w-sm flex-col gap-2">
        {places.length === 0 ? (
          <div className={card}>
            <h2 className="font-semibold">{text.emptyTitle}</h2>
            <p className="mt-1 text-sm text-ink-muted">{text.emptyText}</p>
            <Link
              href="/registrar"
              className={`mt-3 flex min-h-11 items-center justify-center rounded-control bg-accent px-4 text-sm font-semibold text-on-accent ${focusRing}`}
            >
              {text.emptyAction}
            </Link>
          </div>
        ) : tabPlaces.length === 0 && !showList ? (
          <p className={`${card} text-sm`}>{text.emptyTab[tab]}</p>
        ) : null}

        {tab === "trips" && openTrip && !showList ? <TripCard userId={userId} trip={openTrip} /> : null}

        {places.length > 0 && !showList ? <Legend levels={levels} /> : null}
      </div>
    </>
  );
}

/** A legenda fica sempre à vista (seção 7.4). As cores são as do mapa, que é sempre claro. */
function Legend({ levels }: { levels: readonly number[] }) {
  return (
    <div className={`${card} py-3`}>
      <h2 className="text-xs font-semibold">{text.legendTitle}</h2>
      <ul className="mt-2 grid grid-cols-4 gap-2">
        {levelRanges(levels).map(([from, to], index) => (
          <li key={from} className="flex flex-col items-center gap-1 text-xs">
            <LevelSwatch level={index + 1} />
            {text.levelRange(from, to)}
          </li>
        ))}
      </ul>
    </div>
  );
}

function LevelSwatch({ level }: { level: number }) {
  return (
    <span
      aria-hidden="true"
      style={{ backgroundColor: mapColors.levels[level - 1], borderColor: mapColors.levelStroke }}
      className="size-5 shrink-0 rounded-full border"
    />
  );
}

function TripCard({ userId, trip }: { userId: string; trip: { id: string; closesOn: string } }) {
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();

  function confirm() {
    if (pending) return;
    setFailed(false);
    startTransition(async () => {
      const result = await closeTrip(trip.id, userId);
      if (!result.ok && result.sessionChanged) {
        window.location.reload();
        return;
      }
      setOpen(false);
      // Deu certo: o servidor manda a tela de novo, já sem a viagem aberta.
      if (!result.ok) setFailed(true);
    });
  }

  return (
    <div className={card}>
      <h2 className="font-semibold">{text.trip.title}</h2>
      <p className="mt-1 text-sm text-ink-muted">{text.trip.text(formatVisitDate(trip.closesOn))}</p>
      <Confirmable
        label={tripText.closeTrip}
        warning={tripText.closeTripWarning}
        confirm={tripText.closeTripConfirm}
        open={open}
        pending={pending}
        onOpen={() => setOpen(true)}
        onCancel={() => setOpen(false)}
        onConfirm={confirm}
      />
      <p role="status" className="mt-2 text-sm font-medium text-danger">
        {failed ? tripText.actionFailed : ""}
      </p>
    </div>
  );
}

function PlacesList({
  tab,
  places,
  cities,
}: {
  tab: MapTab;
  places: readonly MyVisitedPlace[];
  cities: readonly CitySummary[];
}) {
  return (
    <div className="mx-auto max-w-md">
      <h2 className="sr-only">{text.placesList}</h2>
      {cities.length === 0 ? <p className="mt-4 text-ink-muted">{text.emptyTab[tab]}</p> : null}
      {cities.map((city) => (
        <section key={city.id} aria-labelledby={`city-${city.id}`} className="mt-4 rounded-card bg-surface p-4">
          <h3 id={`city-${city.id}`} className="flex items-center gap-2 text-lg font-semibold">
            <LevelSwatch level={city.level} />
            {city.state ? `${city.name}, ${city.state}` : city.name}
          </h3>
          <p className="text-sm text-ink-muted">{text.places(city.places)}</p>
          <ul className="mt-3 flex flex-col gap-3">
            {places
              .filter((place) => place.city.id === city.id)
              .map((place) => (
                <li key={place.id} className="flex items-start gap-3">
                  <CategoryIcon category={place.category} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium break-words">{place.name}</p>
                    <p className="text-sm text-ink-muted">{categoryLabel(place.category)}</p>
                    <p className="text-sm text-ink-muted">{text.visitedOn(formatVisitDate(place.lastVisitedOn))}</p>
                    {place.visitCount > 1 ? <p className="text-sm text-ink-muted">{text.visits(place.visitCount)}</p> : null}
                  </div>
                  <RatingPill rating={place.rating} />
                </li>
              ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
