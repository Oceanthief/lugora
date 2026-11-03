"use client";

// Client Component: mostra o resultado de cada envio sem recarregar a página.
// Quem fala com o Supabase é a Server Action, no servidor.

import { useActionState } from "react";

import { submitLogin } from "@/app/entrar/actions";
import { strings } from "@/content/pt-BR";
import { CODE_LENGTH, CODE_VALID_MINUTES, initialLoginState, type LoginError } from "@/lib/login";

const text = strings.login;

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
const fieldClass = `mt-2 block min-h-12 w-full rounded-control border border-line bg-surface px-4 text-base text-ink aria-invalid:border-danger ${focusRing}`;
const submitClass = `min-h-12 rounded-control bg-accent px-6 font-semibold text-on-accent disabled:opacity-60 ${focusRing}`;
const secondaryClass = `min-h-11 rounded-control px-4 text-sm font-semibold text-ink-muted underline disabled:opacity-60 ${focusRing}`;

export function LoginForm() {
  const [state, action, pending] = useActionState(submitLogin, initialLoginState);

  if (state.step === "email") {
    return (
      <form action={action} className="mt-2 flex flex-col gap-6">
        <p className="text-ink-muted">{text.subtitle(CODE_LENGTH)}</p>
        <div>
          <label htmlFor="email" className="font-medium">
            {text.email}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            defaultValue={state.email}
            placeholder={text.emailPlaceholder}
            aria-invalid={state.error ? true : undefined}
            aria-describedby={state.error ? "login-error" : undefined}
            className={fieldClass}
          />
          <FieldError error={state.error} />
        </div>
        <button type="submit" name="intent" value="request" disabled={pending} className={submitClass}>
          {pending ? text.sending : text.sendCode}
        </button>
      </form>
    );
  }

  return (
    <form action={action} className="mt-2 flex flex-col gap-6">
      <p className="text-ink-muted">{text.codeSentTo(state.email, CODE_VALID_MINUTES)}</p>
      <input type="hidden" name="email" value={state.email} />
      <div>
        <label htmlFor="code" className="font-medium">
          {text.code(CODE_LENGTH)}
        </label>
        <input
          id="code"
          name="code"
          type="text"
          required
          autoFocus
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={CODE_LENGTH}
          pattern={`[0-9]{${CODE_LENGTH}}`}
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? "login-error" : undefined}
          className={`${fieldClass} text-center text-2xl font-semibold tracking-[0.4em] tabular-nums`}
        />
        <FieldError error={state.error} />
      </div>
      <button type="submit" name="intent" value="verify" disabled={pending} className={submitClass}>
        {pending ? text.verifying : text.verify}
      </button>
      <div className="flex flex-wrap justify-center gap-2">
        {/* formNoValidate: estes dois botões não precisam do código preenchido. */}
        <button type="submit" name="intent" value="resend" formNoValidate disabled={pending} className={secondaryClass}>
          {text.resend}
        </button>
        <button type="submit" name="intent" value="change-email" formNoValidate disabled={pending} className={secondaryClass}>
          {text.changeEmail}
        </button>
      </div>
      <p className="text-center text-sm text-ink-muted">{text.spamHint}</p>
      {/* Leitores de tela anunciam o que aparece aqui. */}
      <p role="status" className="text-center text-sm font-medium">
        {state.resent ? text.resent : ""}
      </p>
    </form>
  );
}

function FieldError({ error }: { error?: LoginError }) {
  if (!error) return null;
  return (
    <p id="login-error" role="alert" className="mt-2 text-sm text-danger">
      {text.errors[error]}
    </p>
  );
}
