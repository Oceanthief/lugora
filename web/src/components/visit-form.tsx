"use client";

// Client Component: o formulário guarda o que a pessoa escolhe (estado) e
// reage a cada toque, o que só acontece no navegador.

import { io } from "next/cache";
import { use, useLayoutEffect, useRef, useState, type FormEvent } from "react";

import { strings } from "@/content/pt-BR";
import { formatRating, toISODate } from "@/lib/format";
import { occasions, type MockPlace, type Occasion } from "@/lib/mock-data";
import {
  MAX_OCCASIONS,
  RATING_OPTIONS,
  toggleOccasion,
  validateVisitDraft,
  type VisitDraftError,
  type VisitDraftErrors,
} from "@/lib/visit-draft";

const text = strings.register;

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

const fieldClass = `mt-2 block min-h-12 w-full rounded-control border border-line bg-surface px-4 text-base text-ink aria-invalid:border-danger ${focusRing}`;

const chipBase =
  "flex min-h-11 cursor-pointer items-center justify-center rounded-control border border-line bg-surface px-4 text-sm font-medium text-ink has-checked:border-accent has-disabled:cursor-not-allowed has-disabled:opacity-40 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent";

/** A nota escolhida acende em âmbar: é a sua avaliação. */
const ratingChipClass = `${chipBase} has-checked:bg-accent has-checked:text-on-accent`;

/** A ocasião escolhida fica em âmbar suave, com contorno âmbar para não depender só da cor. */
const occasionChipClass = `${chipBase} has-checked:bg-glow has-checked:text-on-glow`;

export function VisitForm({ places }: { places: readonly MockPlace[] }) {
  // A data de hoje tem que ser a do aparelho, não a do dia em que o site foi
  // gerado. io() avisa o Next: na geração, ele mostra o aviso do <Suspense>
  // da página; no navegador, segue direto.
  use(io());
  const [today] = useState(() => toISODate(new Date()));

  const [placeId, setPlaceId] = useState("");
  const [visitedOn, setVisitedOn] = useState(today);
  const [rating, setRating] = useState<number | null>(null);
  const [selected, setSelected] = useState<readonly Occasion[]>([]);
  const [errors, setErrors] = useState<VisitDraftErrors>({});
  const [done, setDone] = useState(false);
  const startFresh = useRef(false);

  // O Next mantém esta tela viva ao trocar de aba, então um rascunho não se
  // perde. Depois de um registro concluído, a próxima visita começa do zero.
  useLayoutEffect(
    () => () => {
      if (!startFresh.current) return;
      startFresh.current = false;
      setPlaceId("");
      setVisitedOn(today);
      setRating(null);
      setSelected([]);
      setErrors({});
      setDone(false);
    },
    [today],
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validateVisitDraft(
      { placeId, visitedOn, rating, occasions: selected },
      today,
    );
    const ok = Object.keys(found).length === 0;
    setErrors(found);
    setDone(ok);
    startFresh.current = ok;
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="mt-6 flex flex-col gap-6">
      <div>
        <label htmlFor="place" className="font-medium">
          {text.place}
        </label>
        <select
          id="place"
          value={placeId}
          onChange={(event) => setPlaceId(event.target.value)}
          aria-invalid={errors.placeId ? true : undefined}
          aria-describedby={errors.placeId ? "place-error" : undefined}
          className={fieldClass}
        >
          <option value="">{text.placePlaceholder}</option>
          {places.map((place) => (
            <option key={place.id} value={place.id}>
              {place.name} ({strings.categories[place.category]})
            </option>
          ))}
        </select>
        <FieldError id="place-error" error={errors.placeId} />
      </div>

      <div>
        <label htmlFor="visited-on" className="font-medium">
          {text.date}
        </label>
        <input
          id="visited-on"
          type="date"
          max={today}
          value={visitedOn}
          onChange={(event) => setVisitedOn(event.target.value)}
          aria-invalid={errors.visitedOn ? true : undefined}
          aria-describedby={errors.visitedOn ? "date-error" : undefined}
          className={fieldClass}
        />
        <FieldError id="date-error" error={errors.visitedOn} />
      </div>

      <fieldset aria-describedby={errors.rating ? "rating-error" : undefined}>
        <legend className="font-medium">{text.rating}</legend>
        <div className="mt-2 grid grid-cols-5 gap-2">
          {RATING_OPTIONS.map((value) => (
            <label key={value} className={ratingChipClass}>
              <input
                type="radio"
                name="rating"
                value={value}
                checked={rating === value}
                onChange={() => setRating(value)}
                className="sr-only"
              />
              {formatRating(value)}
            </label>
          ))}
        </div>
        <FieldError id="rating-error" error={errors.rating} />
      </fieldset>

      <fieldset aria-describedby={errors.occasions ? "occasions-error" : undefined}>
        <legend className="font-medium">
          {text.occasions}{" "}
          <span className="font-normal text-ink-muted">
            ({text.occasionsHint(MAX_OCCASIONS)})
          </span>
        </legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {occasions.map((occasion) => {
            const checked = selected.includes(occasion);
            return (
              <label key={occasion} className={occasionChipClass}>
                <input
                  type="checkbox"
                  checked={checked}
                  // No limite, as outras ficam desligadas até desmarcar uma.
                  disabled={!checked && selected.length >= MAX_OCCASIONS}
                  onChange={() => setSelected(toggleOccasion(selected, occasion))}
                  className="sr-only"
                />
                {strings.occasions[occasion]}
              </label>
            );
          })}
        </div>
        <FieldError id="occasions-error" error={errors.occasions} />
      </fieldset>

      <button
        type="submit"
        className={`min-h-12 rounded-control bg-accent px-6 font-semibold text-on-accent ${focusRing}`}
      >
        {text.submit}
      </button>

      {/* Leitores de tela anunciam o que aparece aqui. */}
      <p role="status" className="text-sm font-medium">
        {done ? text.success : ""}
      </p>
    </form>
  );
}

function FieldError({ id, error }: { id: string; error?: VisitDraftError }) {
  if (!error) return null;
  return (
    <p id={id} className="mt-2 text-sm text-danger">
      {text.errors[error]}
    </p>
  );
}
