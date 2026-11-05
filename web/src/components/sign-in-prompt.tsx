import Link from "next/link";

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

/** O convite para entrar nas telas que precisam de login. */
export function SignInPrompt({ title, text, action }: { title: string; text: string; action: string }) {
  return (
    <div className="flex flex-col items-start gap-4">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="text-ink-muted">{text}</p>
      <Link
        href="/entrar"
        className={`flex min-h-12 items-center rounded-control bg-accent px-6 font-semibold text-on-accent ${focusRing}`}
      >
        {action}
      </Link>
    </div>
  );
}
