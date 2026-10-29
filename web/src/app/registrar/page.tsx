import type { Metadata } from "next";
import { Suspense } from "react";

import { VisitForm } from "@/components/visit-form";
import { strings } from "@/content/pt-BR";
import { mockPlaces } from "@/lib/mock-data";

const text = strings.register;

export const metadata: Metadata = { title: text.title };

export default function RegisterPage() {
  const places = [...mockPlaces].sort((a, b) =>
    a.name.localeCompare(b.name, "pt-BR"),
  );

  return (
    <section className="mx-auto max-w-md px-4 py-6">
      <h1 className="text-2xl font-semibold">{text.title}</h1>
      <p className="mt-1 text-zinc-600 dark:text-zinc-400">{text.subtitle}</p>

      {/* O formulário depende da data de hoje no aparelho (veja VisitForm). */}
      <Suspense
        fallback={
          <p className="mt-6 text-zinc-600 dark:text-zinc-400">{text.loading}</p>
        }
      >
        <VisitForm places={places} />
      </Suspense>
    </section>
  );
}
