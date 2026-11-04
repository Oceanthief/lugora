"use client";

// Client Component: mostra os erros de cada envio sem perder o que foi digitado.

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";

import { completeSignup } from "@/app/cadastro/actions";
import { CityPicker } from "@/components/city-picker";
import { strings } from "@/content/pt-BR";
import {
  initialSignupState,
  NAME_MAX_LENGTH,
  OPTIONAL_PURPOSES,
  SIGNUP_FIELDS,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  type SignupError,
  type SignupField,
} from "@/lib/signup";

const text = strings.signup;

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
const fieldClass = `mt-2 block min-h-12 w-full rounded-control border border-line bg-surface px-4 text-base text-ink aria-invalid:border-danger ${focusRing}`;
const checkboxClass = `mt-0.5 size-5 shrink-0 accent-accent ${focusRing}`;
const checkboxLabelClass = "flex min-h-11 cursor-pointer items-start gap-3 py-1";

/** O id do campo que recebe o foco quando o envio volta com erro. */
const FIELD_INPUT_ID: Record<SignupField, string> = {
  name: "name",
  username: "username",
  city: "city",
  ageConfirmed: "age-confirmed",
  policyAccepted: "policy-accepted",
};

export function SignupForm() {
  const [state, action, pending] = useActionState(completeSignup, initialSignupState);
  const { errors, draft } = state;
  const lastFocused = useRef(state);

  // Leva quem usa teclado ou leitor de tela direto ao primeiro problema.
  useEffect(() => {
    if (lastFocused.current === state) return;
    lastFocused.current = state;
    const first = SIGNUP_FIELDS.find((field) => errors[field]);
    if (first) document.getElementById(FIELD_INPUT_ID[first])?.focus();
  }, [state, errors]);

  return (
    <form action={action} noValidate className="mt-2 flex flex-col gap-6">
      <p className="text-ink-muted">{text.subtitle}</p>

      <div>
        <label htmlFor="name" className="font-medium">
          {text.name}
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          maxLength={NAME_MAX_LENGTH}
          defaultValue={draft.name}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? "name-error" : undefined}
          className={fieldClass}
        />
        <FieldError id="name-error" error={errors.name} />
      </div>

      <div>
        <label htmlFor="username" className="font-medium">
          {text.username}
        </label>
        <p id="username-hint" className="mt-1 text-sm text-ink-muted">
          {text.usernameHint(USERNAME_MIN_LENGTH, USERNAME_MAX_LENGTH)}
        </p>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={USERNAME_MAX_LENGTH + 1}
          defaultValue={draft.username}
          placeholder={text.usernamePlaceholder}
          aria-invalid={errors.username ? true : undefined}
          aria-describedby={errors.username ? "username-hint username-error" : "username-hint"}
          className={fieldClass}
        />
        <FieldError id="username-error" error={errors.username} />
      </div>

      <div>
        <CityPicker fieldClass={fieldClass} error={errors.city} errorId="city-error" />
        <FieldError id="city-error" error={errors.city} />
      </div>

      <div className="flex flex-col gap-2">
        <div>
          <label className={checkboxLabelClass}>
            <input
              id="age-confirmed"
              name="age_confirmed"
              type="checkbox"
              defaultChecked={draft.ageConfirmed}
              aria-invalid={errors.ageConfirmed ? true : undefined}
              aria-describedby={errors.ageConfirmed ? "age-error" : undefined}
              className={checkboxClass}
            />
            <span>{text.ageConfirmed}</span>
          </label>
          <FieldError id="age-error" error={errors.ageConfirmed} />
        </div>

        <div>
          <label className={checkboxLabelClass}>
            <input
              id="policy-accepted"
              name="policy_accepted"
              type="checkbox"
              defaultChecked={draft.policyAccepted}
              aria-invalid={errors.policyAccepted ? true : undefined}
              aria-describedby={errors.policyAccepted ? "policy-error" : undefined}
              className={checkboxClass}
            />
            <span>
              {text.policyBefore}
              {/* Em outra aba, para não perder o que já foi preenchido. */}
              <Link href="/privacidade" target="_blank" className="font-semibold underline">
                {text.policyLink}
              </Link>
              {text.policyAfter}
            </span>
          </label>
          <FieldError id="policy-error" error={errors.policyAccepted} />
        </div>
      </div>

      <fieldset>
        <legend className="font-medium">{text.optionalTitle}</legend>
        <p className="mt-1 text-sm text-ink-muted">{text.optionalHint}</p>
        <div className="mt-2 flex flex-col gap-2">
          {OPTIONAL_PURPOSES.map((purpose) => (
            <label key={purpose} className={checkboxLabelClass}>
              <input
                name="purposes"
                type="checkbox"
                value={purpose}
                defaultChecked={draft.grantedPurposes.includes(purpose)}
                className={checkboxClass}
              />
              <span>
                <span className="block font-medium">{text.purposes[purpose].label}</span>
                <span className="block text-sm text-ink-muted">{text.purposes[purpose].description}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={pending}
        className={`min-h-12 rounded-control bg-accent px-6 font-semibold text-on-accent disabled:opacity-60 ${focusRing}`}
      >
        {pending ? text.submitting : text.submit}
      </button>

      {/* Leitores de tela anunciam o que aparece aqui. */}
      <p role="status" className="text-sm font-medium text-danger">
        {state.failed ? text.failed : ""}
      </p>
    </form>
  );
}

function FieldError({ id, error }: { id: string; error?: SignupError }) {
  if (!error) return null;
  return (
    <p id={id} className="mt-2 text-sm text-danger">
      {text.errors[error]}
    </p>
  );
}
