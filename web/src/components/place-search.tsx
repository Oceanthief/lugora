"use client";

// Client Component: a lista muda enquanto a pessoa digita, e o GPS só existe no
// navegador. Quem fala com o banco é a Server Action, no servidor.

import { useRef, useState } from "react";

import { nearbyPlaces, searchPlaces } from "@/app/registrar/actions";
import { CategoryIcon } from "@/components/category-icon";
import { strings } from "@/content/pt-BR";
import { isPlaceCategory } from "@/lib/categories";
import { formatDistance } from "@/lib/format";
import { isSelectablePlace, PLACE_SEARCH_MIN_LENGTH, type PlaceResult, type Position } from "@/lib/places";

const text = strings.register;

const SEARCH_DELAY_MS = 250;

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

type SearchStatus = "idle" | "searching" | "done" | "failed";
type LocationStatus = "idle" | "locating" | "on" | "failed";

export function PlaceSearch({
  userId,
  canUseLocation,
  selected,
  onSelect,
  fieldClass,
  invalid,
  describedBy,
}: {
  userId: string;
  canUseLocation: boolean;
  selected: PlaceResult | null;
  onSelect: (place: PlaceResult | null) => void;
  fieldClass: string;
  invalid: boolean;
  describedBy?: string;
}) {
  const [query, setQuery] = useState("");
  const [places, setPlaces] = useState<PlaceResult[]>([]);
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");
  // Fica só na memória desta tela: nada guarda onde a pessoa estava.
  const position = useRef<Position | null>(null);
  // "Perto de você": aparece com o GPS ligado enquanto nada está digitado.
  const [nearby, setNearby] = useState<PlaceResult[]>([]);
  const [nearbyStatus, setNearbyStatus] = useState<SearchStatus>("idle");

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Uma resposta lenta não pode sobrescrever a de uma busca mais nova.
  const lastRequest = useRef(0);

  function search(value: string, delay: number) {
    if (timer.current) clearTimeout(timer.current);
    lastRequest.current += 1;

    if (value.trim().length < PLACE_SEARCH_MIN_LENGTH) {
      setPlaces([]);
      setStatus("idle");
      return;
    }

    setStatus("searching");
    const request = lastRequest.current;
    timer.current = setTimeout(async () => {
      const result = await searchPlaces(value, canUseLocation ? position.current : null, userId);
      // A sessão mudou em outra aba: recarregar apaga o que esta aba guarda de quem saiu.
      if (result.sessionChanged) {
        window.location.reload();
        return;
      }
      if (request !== lastRequest.current) return;
      setPlaces(result.places);
      setStatus(result.failed ? "failed" : "done");
    }, delay);
  }

  function handleChange(value: string) {
    setQuery(value);
    search(value, SEARCH_DELAY_MS);
  }

  function requestLocation() {
    if (!navigator.geolocation) {
      setLocationStatus("failed");
      return;
    }
    setLocationStatus("locating");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const current = { latitude: coords.latitude, longitude: coords.longitude };
        position.current = current;
        setLocationStatus("on");
        // Refaz a busca para trazer as distâncias do que já está na tela.
        search(query, 0);
        void loadNearby(current);
      },
      () => setLocationStatus("failed"),
      { timeout: 10_000, maximumAge: 60_000 },
    );
  }

  async function loadNearby(current: Position) {
    setNearbyStatus("searching");
    const result = await nearbyPlaces(current, userId);
    if (result.sessionChanged) {
      window.location.reload();
      return;
    }
    setNearby(result.places);
    setNearbyStatus(result.failed ? "failed" : "done");
  }

  // Digitou: vale a busca. Apagou: a lista de perto volta, sem pedir de novo ao banco.
  const showingNearby = query.trim().length < PLACE_SEARCH_MIN_LENGTH && nearbyStatus !== "idle";
  const list = showingNearby ? nearby : places;

  function choose(place: PlaceResult) {
    onSelect(place);
    setQuery("");
    setPlaces([]);
    setStatus("idle");
  }

  return (
    <div>
      <label htmlFor="place" className="font-medium">
        {text.place}
      </label>

      {selected ? (
        <div className="mt-2 flex items-center justify-between gap-3 rounded-control border border-accent bg-surface px-4 py-2">
          <span className="min-w-0">
            <span className="block font-medium break-words">{selected.name}</span>
            <span className="block text-sm text-ink-muted break-words">{selected.address ?? text.placeNoAddress}</span>
          </span>
          <button
            type="button"
            onClick={() => onSelect(null)}
            className={`min-h-11 shrink-0 rounded-control px-2 text-sm font-semibold text-ink-muted underline ${focusRing}`}
          >
            {text.placeChange}
          </button>
        </div>
      ) : (
        <>
          <input
            id="place"
            type="text"
            value={query}
            onChange={(event) => handleChange(event.target.value)}
            onKeyDown={(event) => {
              // Enter aqui é buscar, não enviar o formulário inteiro.
              if (event.key === "Enter") event.preventDefault();
            }}
            autoComplete="off"
            placeholder={text.placePlaceholder}
            aria-invalid={invalid ? true : undefined}
            aria-describedby={describedBy}
            className={fieldClass}
          />

          {canUseLocation ? (
            <div className="mt-2">
              {locationStatus === "idle" || locationStatus === "failed" ? (
                <button
                  type="button"
                  onClick={requestLocation}
                  className={`min-h-11 rounded-control border border-line px-4 text-sm font-semibold ${focusRing}`}
                >
                  {text.useLocation}
                </button>
              ) : null}
              <p role="status" className="mt-1 text-sm text-ink-muted">
                {locationText(locationStatus)}
              </p>
            </div>
          ) : null}

          {showingNearby ? (
            <h2 id="nearby-title" className="mt-4 text-sm font-semibold">
              {text.nearbyTitle}
            </h2>
          ) : null}

          {list.length > 0 ? (
            <ul aria-labelledby={showingNearby ? "nearby-title" : undefined} className="mt-2 flex flex-col gap-1">
              {list.map((place) => (
                <li key={place.id}>
                  <PlaceOption place={place} onChoose={choose} />
                </li>
              ))}
            </ul>
          ) : null}

          {/* Leitores de tela anunciam o resultado da busca. */}
          <p role="status" className="mt-2 text-sm text-ink-muted">
            {showingNearby ? nearbyText(nearbyStatus, nearby.length) : statusText(status, places.length)}
          </p>
          {list.length > 0 ? <p className="mt-1 text-xs text-ink-muted">{text.placeCredit}</p> : null}
        </>
      )}
    </div>
  );
}

function PlaceOption({ place, onChoose }: { place: PlaceResult; onChoose: (place: PlaceResult) => void }) {
  const known = isPlaceCategory(place.category) ? place.category : null;
  const distance = place.distanceMeters === null ? null : text.placeDistance(formatDistance(place.distanceMeters));
  const selectable = isSelectablePlace(place);
  // O aviso de residencial, logo abaixo, já diz a categoria.
  const details = [known && selectable ? strings.categories[known] : null, distance].filter(Boolean).join(", ");

  const content = (
    <>
      {known ? <CategoryIcon category={known} /> : <span aria-hidden="true" className="size-11 shrink-0" />}
      <span className="min-w-0">
        <span className="block font-medium break-words">{place.name}</span>
        <span className="block text-sm text-ink-muted break-words">{place.address ?? text.placeNoAddress}</span>
        {details ? <span className="block text-sm text-ink-muted">{details}</span> : null}
        {!selectable ? (
          <span className="block text-sm font-medium text-ink-muted">{text.placeResidential}</span>
        ) : !place.isVisitable ? (
          <span className="block text-sm text-ink-muted">{text.placeNotVisitable}</span>
        ) : null}
      </span>
    </>
  );

  const rowClass = "flex min-h-11 w-full items-start gap-3 rounded-control border border-line px-3 py-2 text-left";

  // Condomínio aparece para quem procura pelo nome, mas não é um botão: não dá para escolher.
  if (!selectable) return <div className={`${rowClass} opacity-70`}>{content}</div>;

  return (
    <button type="button" onClick={() => onChoose(place)} className={`${rowClass} bg-surface ${focusRing}`}>
      {content}
    </button>
  );
}

function statusText(status: SearchStatus, found: number): string {
  if (status === "searching") return text.placeSearching;
  if (status === "failed") return text.placeSearchFailed;
  if (status === "done") return found === 0 ? text.placeNotFound : text.placeFound(found);
  return "";
}

function nearbyText(status: SearchStatus, found: number): string {
  if (status === "searching") return text.nearbySearching;
  if (status === "failed") return text.nearbyFailed;
  if (status === "done") return found === 0 ? text.nearbyNone : text.nearbyFound(found);
  return "";
}

function locationText(status: LocationStatus): string {
  if (status === "locating") return text.locating;
  if (status === "on") return text.locationOn;
  if (status === "failed") return text.locationFailed;
  return "";
}
