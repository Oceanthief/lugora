import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { MapView } from "@/components/map-view";
import { SignInPrompt } from "@/components/sign-in-prompt";
import { strings } from "@/content/pt-BR";
import { hasProfile } from "@/lib/supabase/profile";
import { getCurrentUser } from "@/lib/supabase/session";
import { getCityLevels, getMyVisitedPlaces, getOpenTrip } from "@/lib/supabase/visits";

const text = strings.map;

export const metadata: Metadata = { title: text.title };

export default function MapPage() {
  return (
    // Ocupa a tela inteira, por baixo da barra que flutua (direção C). "isolate" faz a ordem de
    // empilhamento do mapa, da lista e dos cartões valer só aqui dentro: a barra fica sempre por cima.
    <section className="absolute inset-0 isolate">
      {/* A sessão vem dos cookies do pedido; por isso esta parte fica no Suspense. */}
      <Suspense fallback={<p className="p-4 text-ink-muted">{text.loading}</p>}>
        <MapContent />
      </Suspense>
    </section>
  );
}

async function MapContent() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-6">
        <SignInPrompt title={text.signedOutTitle} text={text.signedOutText} action={text.signIn} />
      </div>
    );
  }
  if (!(await hasProfile(user.id))) redirect("/cadastro");

  // O mapa é pessoal: só as visitas de quem está logado (seção 7.4).
  const [places, levels, openTrip] = await Promise.all([getMyVisitedPlaces(), getCityLevels(), getOpenTrip()]);

  return (
    <>
      <h1 className="sr-only">{text.title}</h1>
      {/* A chave faz outra pessoa começar do zero, sem a aba e a câmera de quem usava o aparelho antes. */}
      <MapView key={user.id} userId={user.id} places={places} levels={levels} openTrip={openTrip} />
    </>
  );
}
