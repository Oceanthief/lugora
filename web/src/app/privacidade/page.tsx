import type { Metadata } from "next";
import { Suspense } from "react";

import { strings } from "@/content/pt-BR";
import { getPrivacyPolicyVersion } from "@/lib/supabase/profile";

const text = strings.privacy;

export const metadata: Metadata = { title: text.title };

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-md px-4 py-6">
      <h1 className="text-2xl font-semibold">{text.title}</h1>
      <p className="mt-2 text-sm text-ink-muted">
        <Suspense fallback={text.draftNotice(null)}>
          <DraftNotice />
        </Suspense>
      </p>

      {text.sections.map((section) => (
        <section key={section.title} className="mt-6">
          <h2 className="text-lg font-semibold">{section.title}</h2>
          {section.text ? <p className="mt-2">{section.text}</p> : null}
          {section.items.length > 0 ? (
            <ul className="mt-2 flex list-disc flex-col gap-2 pl-5">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}
    </article>
  );
}

async function DraftNotice() {
  return text.draftNotice(await getPrivacyPolicyVersion());
}
