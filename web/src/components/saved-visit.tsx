"use client";

// Client Component: os botões "Publicar agora" e "Encerrar viagem" pedem
// confirmação e mudam a tela na hora, o que só acontece no navegador.

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";

import { closeTrip, publishVisitNow, type SavedVisit } from "@/app/registrar/actions";
import { strings } from "@/content/pt-BR";
import { formatVisitDate } from "@/lib/format";

const text = strings.register.saved;

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
const secondaryButton = `min-h-11 rounded-control border border-line px-4 text-sm font-semibold ${focusRing}`;
const primaryButton = `flex min-h-12 items-center justify-center rounded-control bg-accent px-6 font-semibold text-on-accent ${focusRing}`;

type Confirming = "publish" | "closeTrip" | null;

export function SavedVisitPanel({
  visit,
  userId,
  today,
  onAnother,
}: {
  visit: SavedVisit;
  userId: string;
  today: string;
  onAnother: () => void;
}) {
  const [publishOn, setPublishOn] = useState(visit.publishOn);
  const [confirming, setConfirming] = useState<Confirming>(null);
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();
  const titleRef = useRef<HTMLHeadingElement>(null);

  // O formulário sumiu: o foco vai para o título, e o leitor de tela lê o que aconteceu.
  useEffect(() => titleRef.current?.focus(), []);

  // Para quem a visita aparece; "só eu" não aparece para ninguém.
  const audience = visit.visibility === "private" ? null : visit.visibility;
  // Datas AAAA-MM-DD podem ser comparadas como texto.
  const published = publishOn <= today;

  function run(action: () => Promise<{ ok: boolean; sessionChanged?: boolean; publishOn?: string }>) {
    if (pending) return;
    setFailed(false);
    startTransition(async () => {
      const result = await action();
      if (result.sessionChanged) {
        window.location.reload();
        return;
      }
      setConfirming(null);
      if (!result.ok) {
        setFailed(true);
        return;
      }
      setPublishOn(result.publishOn ?? today);
    });
  }

  return (
    <section aria-labelledby="saved-title" className="mt-6 rounded-card border border-line bg-surface p-4">
      <h2 id="saved-title" ref={titleRef} tabIndex={-1} className="text-xl font-semibold">
        {text.title}
      </h2>
      <p className="mt-2">{text.visibility[visit.visibility]}</p>

      {audience ? (
        published ? (
          <p className="mt-2 text-ink-muted">{text.published[audience]}</p>
        ) : visit.tripId ? (
          <>
            <p className="mt-2 text-ink-muted">{text.tripPublishOn(formatVisitDate(publishOn))}</p>
            <Confirmable
              label={text.closeTrip}
              warning={text.closeTripWarning}
              confirm={text.closeTripConfirm}
              open={confirming === "closeTrip"}
              pending={pending}
              onOpen={() => setConfirming("closeTrip")}
              onCancel={() => setConfirming(null)}
              onConfirm={() => run(() => closeTrip(visit.tripId ?? "", userId))}
            />
          </>
        ) : (
          <>
            <p className="mt-2 text-ink-muted">{text.publishOn[audience](formatVisitDate(publishOn))}</p>
            <Confirmable
              label={text.publishNow}
              warning={text.publishNowWarning}
              confirm={text.publishNowConfirm}
              open={confirming === "publish"}
              pending={pending}
              onOpen={() => setConfirming("publish")}
              onCancel={() => setConfirming(null)}
              onConfirm={() => run(() => publishVisitNow(visit.id, userId))}
            />
          </>
        )
      ) : null}

      <p role="status" className="mt-2 text-sm font-medium text-danger">
        {failed ? text.actionFailed : ""}
      </p>

      <div className="mt-4 flex flex-col gap-2">
        <button type="button" onClick={onAnother} className={primaryButton}>
          {text.another}
        </button>
        <Link href="/mapa" className={`${secondaryButton} flex items-center justify-center`}>
          {text.seeOnMap}
        </Link>
      </div>
    </section>
  );
}

/** Uma ação com aviso de segurança: o primeiro toque só mostra o aviso e pede confirmação. */
export function Confirmable({
  label,
  warning,
  confirm,
  open,
  pending,
  onOpen,
  onCancel,
  onConfirm,
}: {
  label: string;
  warning: string;
  confirm: string;
  open: boolean;
  pending: boolean;
  onOpen: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) {
    return (
      <button type="button" onClick={onOpen} className={`mt-3 ${secondaryButton}`}>
        {label}
      </button>
    );
  }

  return (
    <div className="mt-3 rounded-control border border-accent p-3">
      {/* role="alert": o aviso é lido assim que aparece. */}
      <p role="alert" className="text-sm">
        {warning}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onConfirm}
          aria-disabled={pending}
          className={`min-h-11 rounded-control bg-accent px-4 text-sm font-semibold text-on-accent aria-disabled:opacity-60 ${focusRing}`}
        >
          {confirm}
        </button>
        <button type="button" onClick={onCancel} className={secondaryButton}>
          {text.cancel}
        </button>
      </div>
    </div>
  );
}
