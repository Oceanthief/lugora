import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { SignInPrompt } from "@/components/sign-in-prompt";
import { VisitForm } from "@/components/visit-form";
import { strings } from "@/content/pt-BR";
import { hasLocationConsent, hasProfile } from "@/lib/supabase/profile";
import { getCurrentUser } from "@/lib/supabase/session";

const text = strings.register;

export const metadata: Metadata = { title: text.title };

export default function RegisterPage() {
  return (
    <section className="mx-auto max-w-md px-4 py-6">
      {/* A sessão vem dos cookies do pedido; por isso esta parte fica no Suspense. */}
      <Suspense fallback={<p className="text-ink-muted">{text.loading}</p>}>
        <RegisterContent />
      </Suspense>
    </section>
  );
}

async function RegisterContent() {
  const user = await getCurrentUser();
  if (!user) return <SignInPrompt title={text.signedOutTitle} text={text.signedOutText} action={text.signIn} />;
  if (!(await hasProfile(user.id))) redirect("/cadastro");

  return (
    <>
      <h1 className="text-2xl font-semibold">{text.title}</h1>
      <p className="mt-1 text-ink-muted">{text.subtitle}</p>
      <VisitForm canUseLocation={await hasLocationConsent(user.id)} />
    </>
  );
}
