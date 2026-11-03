import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { LoginForm } from "@/components/login-form";
import { strings } from "@/content/pt-BR";
import { getCurrentUser } from "@/lib/supabase/session";

const text = strings.login;

export const metadata: Metadata = { title: text.title };

export default function LoginPage() {
  return (
    <section className="mx-auto max-w-md px-4 py-6">
      <h1 className="text-2xl font-semibold">{text.title}</h1>
      <Suspense fallback={<p className="mt-2 text-ink-muted">{text.loading}</p>}>
        <LoginContent />
      </Suspense>
    </section>
  );
}

async function LoginContent() {
  const user = await getCurrentUser();
  if (user) redirect("/perfil");
  return <LoginForm />;
}
