"use client";

// Client Component: a lista de cidades muda enquanto a pessoa digita.

import { useRef, useState } from "react";

import { searchCities } from "@/app/cadastro/actions";
import { strings } from "@/content/pt-BR";
import { CITY_SEARCH_MIN_LENGTH, type CityOption, type SignupError } from "@/lib/signup";

const text = strings.signup;

const SEARCH_DELAY_MS = 250;

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

type Status = "idle" | "searching" | "done" | "failed";

export function CityPicker({
  fieldClass,
  error,
  errorId,
}: {
  fieldClass: string;
  error?: SignupError;
  errorId: string;
}) {
  const [query, setQuery] = useState("");
  const [cities, setCities] = useState<CityOption[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [selected, setSelected] = useState<CityOption | null>(null);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Uma resposta lenta não pode sobrescrever a de uma busca mais nova.
  const lastRequest = useRef(0);

  function handleChange(value: string) {
    setQuery(value);
    if (timer.current) clearTimeout(timer.current);
    lastRequest.current += 1;

    if (value.trim().length < CITY_SEARCH_MIN_LENGTH) {
      setCities([]);
      setStatus("idle");
      return;
    }

    setStatus("searching");
    const request = lastRequest.current;
    timer.current = setTimeout(async () => {
      const result = await searchCities(value);
      if (request !== lastRequest.current) return;
      setCities(result.cities);
      setStatus(result.failed ? "failed" : "done");
    }, SEARCH_DELAY_MS);
  }

  function choose(city: CityOption) {
    setSelected(city);
    setQuery("");
    setCities([]);
    setStatus("idle");
  }

  return (
    <div>
      <label htmlFor="city" className="font-medium">
        {text.city}
      </label>
      <p id="city-hint" className="mt-1 text-sm text-ink-muted">
        {text.cityHint}
      </p>

      {/* O formulário envia só o identificador da cidade escolhida. */}
      <input type="hidden" name="city_id" value={selected?.id ?? ""} />

      {selected ? (
        <div className="mt-2 flex min-h-12 items-center justify-between gap-3 rounded-control border border-accent bg-surface px-4">
          <span className="font-medium">{text.cityOption(selected.name, selected.state)}</span>
          <button
            type="button"
            onClick={() => setSelected(null)}
            className={`min-h-11 shrink-0 rounded-control px-2 text-sm font-semibold text-ink-muted underline ${focusRing}`}
          >
            {text.cityChange}
          </button>
        </div>
      ) : (
        <>
          <input
            id="city"
            type="text"
            value={query}
            onChange={(event) => handleChange(event.target.value)}
            autoComplete="off"
            placeholder={text.cityPlaceholder}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `city-hint ${errorId}` : "city-hint"}
            className={fieldClass}
          />
          {cities.length > 0 ? (
            <ul className="mt-2 flex flex-col gap-1">
              {cities.map((city) => (
                <li key={city.id}>
                  <button
                    type="button"
                    onClick={() => choose(city)}
                    className={`min-h-11 w-full rounded-control border border-line bg-surface px-4 py-2 text-left ${focusRing}`}
                  >
                    {text.cityOption(city.name, city.state)}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {/* Leitores de tela anunciam o resultado da busca. */}
          <p role="status" className="mt-2 text-sm text-ink-muted">
            {statusText(status, cities.length)}
          </p>
        </>
      )}
    </div>
  );
}

function statusText(status: Status, found: number): string {
  if (status === "searching") return text.citySearching;
  if (status === "failed") return text.citySearchFailed;
  if (status === "done") return found === 0 ? text.cityNotFound : text.cityFound(found);
  return "";
}
