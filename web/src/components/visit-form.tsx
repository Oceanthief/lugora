"use client";

// Client Component: o formulário guarda o que a pessoa escolhe (estado) e
// reage a cada toque, o que só acontece no navegador. Quem grava é a Server
// Action, no servidor, e o banco confere tudo de novo.

import { io } from "next/cache";
import { use, useLayoutEffect, useRef, useState, useTransition, type FormEvent } from "react";

import { saveVisit, type SavedVisit } from "@/app/registrar/actions";
import { PlaceSearch } from "@/components/place-search";
import { SavedVisitPanel } from "@/components/saved-visit";
import { strings } from "@/content/pt-BR";
import { formatRating, toISODate } from "@/lib/format";
import { occasions, type Occasion } from "@/lib/occasions";
import type { PlaceResult } from "@/lib/places";
import {
  defaultVisibilityFor,
  RATING_OPTIONS,
  toggleOccasion,
  validateVisitDraft,
  VISIBILITY_OPTIONS,
  type Visibility,
  type VisitDraft,
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

/** Ocasião e visibilidade escolhidas ficam em âmbar suave, com contorno âmbar para não depender só da cor. */
const softChipClass = `${chipBase} has-checked:bg-glow has-checked:text-on-glow`;

type VisitFormProps = {
  userId: string;
  canUseLocation: boolean;
  defaultVisibility: Visibility;
  maxOccasions: number;
};

export function VisitForm(props: VisitFormProps) {
  // A data de hoje tem que ser a do aparelho, não a do dia em que o site foi
  // gerado. io() avisa o Next: na geração, ele mostra o aviso do <Suspense>
  // da página; no navegador, segue direto.
  use(io());
  const [today] = useState(() => toISODate(new Date()));
  const [saved, setSaved] = useState<SavedVisit | null>(null);
  const startFresh = useRef(false);

  // O Next mantém esta tela viva ao trocar de aba, então um rascunho não se
  // perde. Depois de um registro concluído, a próxima visita começa do zero.
  useLayoutEffect(
    () => () => {
      if (!startFresh.current) return;
      startFresh.current = false;
      setSaved(null);
    },
    [],
  );

  if (saved) {
    return (
      <SavedVisitPanel
        visit={saved}
        userId={props.userId}
        today={today}
        onAnother={() => {
          startFresh.current = false;
          setSaved(null);
        }}
      />
    );
  }

  return (
    <VisitFields
      {...props}
      today={today}
      onSaved={(visit) => {
        startFresh.current = true;
        setSaved(visit);
      }}
    />
  );
}

/** Os campos ficam num componente à parte: ao salvar, ele sai da tela, e o próximo registro começa vazio. */
function VisitFields({
  userId,
  canUseLocation,
  defaultVisibility,
  maxOccasions,
  today,
  onSaved,
}: VisitFormProps & { today: string; onSaved: (visit: SavedVisit) => void }) {
  const [place, setPlace] = useState<PlaceResult | null>(null);
  const [visitedOn, setVisitedOn] = useState(today);
  const [rating, setRating] = useState<number | null>(null);
  const [selected, setSelected] = useState<readonly Occasion[]>([]);
  // null enquanto a pessoa não escolhe: o banco aplica o padrão.
  const [visibility, setVisibility] = useState<Visibility | null>(null);
  const [errors, setErrors] = useState<VisitDraftErrors>({});
  const [failed, setFailed] = useState(false);
  const [saving, startSaving] = useTransition();

  const shownVisibility = visibility ?? defaultVisibilityFor(place, defaultVisibility);

  function choosePlace(next: PlaceResult | null) {
    setPlace(next);
    // Lugar sensível volta para o padrão, "só eu", mesmo que a pessoa tenha escolhido antes.
    if (next?.isSensitive) setVisibility(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    const draft: VisitDraft = { placeId: place?.id ?? "", visitedOn, rating, occasions: selected, visibility };
    const found = validateVisitDraft(draft, today, maxOccasions);
    setErrors(found);
    setFailed(false);
    if (Object.keys(found).length > 0) return;

    startSaving(async () => {
      const result = await saveVisit(draft, userId);
      // A sessão mudou em outra aba: recarregar apaga o que esta aba guarda de quem saiu.
      if (!result.ok && result.sessionChanged) {
        window.location.reload();
        return;
      }
      if (result.ok) {
        onSaved(result.visit);
        return;
      }
      setErrors(result.errors);
      setFailed(Boolean(result.failed));
    });
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="mt-6 flex flex-col gap-6">
      <div>
        <PlaceSearch
          userId={userId}
          canUseLocation={canUseLocation}
          selected={place}
          onSelect={choosePlace}
          fieldClass={fieldClass}
          invalid={Boolean(errors.placeId)}
          describedBy={errors.placeId ? "place-error" : undefined}
        />
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
          <span className="font-normal text-ink-muted">({text.occasionsHint(maxOccasions)})</span>
        </legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {occasions.map((occasion) => {
            const checked = selected.includes(occasion);
            return (
              <label key={occasion} className={softChipClass}>
                <input
                  type="checkbox"
                  checked={checked}
                  // No limite, as outras ficam desligadas até desmarcar uma.
                  disabled={!checked && selected.length >= maxOccasions}
                  onChange={() => setSelected(toggleOccasion(selected, occasion, maxOccasions))}
                  className="sr-only"
                />
                {strings.occasions[occasion]}
              </label>
            );
          })}
        </div>
        <FieldError id="occasions-error" error={errors.occasions} />
      </fieldset>

      <fieldset aria-describedby="visibility-note">
        <legend className="font-medium">{text.visibility}</legend>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {VISIBILITY_OPTIONS.map((option) => (
            <label key={option} className={softChipClass}>
              <input
                type="radio"
                name="visibility"
                value={option}
                checked={shownVisibility === option}
                onChange={() => setVisibility(option)}
                className="sr-only"
              />
              {text.visibilityOptions[option]}
            </label>
          ))}
        </div>
        <p id="visibility-note" className="mt-2 text-sm text-ink-muted">
          {place?.isSensitive
            ? shownVisibility === "private"
              ? text.sensitiveDefault
              : text.sensitiveWarning
            : text.visibilityHint}
        </p>
      </fieldset>

      <button
        type="submit"
        aria-disabled={saving}
        className={`min-h-12 rounded-control bg-accent px-6 font-semibold text-on-accent aria-disabled:opacity-60 ${focusRing}`}
      >
        {saving ? text.saving : text.submit}
      </button>

      {/* Leitores de tela anunciam o que aparece aqui. */}
      <p role="status" className="text-sm font-medium text-danger">
        {failed ? text.saveFailed : ""}
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
