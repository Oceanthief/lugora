import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { SignupForm } from "@/components/signup-form";
import { strings } from "@/content/pt-BR";
import { hasProfile } from "@/lib/supabase/profile";
import { getCurrentUser } from "@/lib/supabase/session";

const text = strings.signup;

export const metadata: Metadata = { title: text.title };

export default function SignupPage() {
  return (
    <section className="mx-auto max-w-md px-4 py-6">
      <h1 className="text-2xl font-semibold">{text.title}</h1>
      <Suspense fallback={<p className="mt-2 text-ink-muted">{text.loading}</p>}>
        <SignupContent />
      </Suspense>
    </section>
  );
}

async function SignupContent() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  if (await hasProfile(user.id)) redirect("/perfil");
  return <SignupForm />;
}
