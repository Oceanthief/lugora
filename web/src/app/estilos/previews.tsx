import type { CSSProperties } from "react";

import { NavIconSvg } from "@/components/nav-icons";
import { strings } from "@/content/pt-BR";
import { categoryIconPaths } from "@/lib/category-icons";
import { formatRating } from "@/lib/format";
import { navItems } from "@/lib/navigation";

import type { Direction, ThemeColors } from "./directions";
import type { DirectionFonts } from "./fonts";

/** A visita de exemplo, a mesma nas três direções. */
const sample = {
  name: "Cervejaria Württemberg",
  category: "brewery" as const,
  city: "Juiz de Fora",
  rating: formatRating(4.5),
  date: "12/10/2026",
  occasion: strings.occasions.with_friends,
};
const sampleCategory = `${strings.categories[sample.category]} em ${sample.city}`;
const levelLabels = ["1", "2 a 5", "6 a 15", "16 ou mais"];

type PreviewProps = { direction: Direction; colors: ThemeColors; fonts: DirectionFonts };

function themeVars(colors: ThemeColors, fonts: DirectionFonts, direction: Direction): CSSProperties {
  return {
    "--canvas": colors.canvas,
    "--surface": colors.surface,
    "--text": colors.text,
    "--muted": colors.muted,
    "--accent": colors.accent,
    "--on-accent": colors.onAccent,
    "--soft": colors.soft,
    "--on-soft": colors.onSoft,
    "--border": colors.border,
    "--radius-card": direction.radius.card,
    "--radius-control": direction.radius.control,
    fontFamily: fonts.body,
  } as CSSProperties;
}

/** Uma "tela" da direção num dos temas, com as peças principais do app. */
export function ThemePreview({ direction, colors, fonts, label }: PreviewProps & { label: string }) {
  return (
    <figure
      style={themeVars(colors, fonts, direction)}
      className="overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--canvas)] text-[var(--text)]"
    >
      <figcaption className="px-4 pt-3 text-xs text-[var(--muted)]">{label}</figcaption>
      <div className="flex flex-col gap-5 p-4">
        <VisitCard direction={direction} colors={colors} fonts={fonts} />
        <Controls />
        <Legend direction={direction} colors={colors} />
      </div>
      <Nav direction={direction} />
    </figure>
  );
}

function CategoryGlyph({ className }: { className: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {categoryIconPaths[sample.category].map((path) => (
        <path key={path} d={path} />
      ))}
    </svg>
  );
}

function Chip({ children, selected }: { children: string; selected?: boolean }) {
  return (
    <span
      className={`inline-flex min-h-9 items-center rounded-[var(--radius-control)] px-3 text-sm font-medium ${
        selected
          ? "bg-[var(--soft)] text-[var(--on-soft)]"
          : "border border-[var(--border)] text-[var(--text)]"
      }`}
    >
      {children}
    </span>
  );
}

function VisitCard({ direction, fonts }: PreviewProps) {
  const display = { fontFamily: fonts.display };

  if (direction.id === "a") {
    // O nome do lugar como uma placa de rua: azul, com o filete branco por dentro.
    return (
      <article className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="inline-block rounded-[var(--radius-control)] bg-[var(--accent)] px-3 py-2 text-[var(--on-accent)] shadow-[inset_0_0_0_3px_var(--accent),inset_0_0_0_4.5px_var(--on-accent)]">
          <h3 style={display} className="text-lg font-bold leading-tight">
            {sample.name}
          </h3>
        </div>
        <p className="mt-2 text-sm text-[var(--muted)]">{sampleCategory}</p>
        <div className="mt-3 flex items-end justify-between">
          <p>
            <span style={display} className="text-3xl font-bold">
              {sample.rating}
            </span>
            <span className="ml-1.5 text-sm text-[var(--muted)]">sua nota</span>
          </p>
          <p className="text-sm text-[var(--muted)]">{sample.date}</p>
        </div>
        <div className="mt-3">
          <Chip selected>{sample.occasion}</Chip>
        </div>
      </article>
    );
  }

  if (direction.id === "b") {
    // Uma anotação de caderno: data em cima, nome em serifa e a nota grande.
    return (
      <article className="rounded-[var(--radius-card)] bg-[var(--surface)] p-5">
        <p className="text-sm text-[var(--muted)]">{sample.date}</p>
        <div className="mt-1 flex items-start justify-between gap-4">
          <h3 style={display} className="text-2xl leading-tight">
            {sample.name}
          </h3>
          <p style={display} className="text-5xl leading-none text-[var(--accent)]">
            {sample.rating}
          </p>
        </div>
        <p className="mt-1 text-sm text-[var(--muted)]">{sampleCategory}</p>
        <div className="mt-4">
          <Chip selected>{sample.occasion}</Chip>
        </div>
      </article>
    );
  }

  // Luz de poste: o ícone aceso, a nota numa pílula âmbar.
  return (
    <article className="flex gap-3 rounded-[var(--radius-card)] bg-[var(--surface)] p-4">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--soft)] text-[var(--accent)] shadow-[0_0_24px_-4px_var(--accent)]">
        <CategoryGlyph className="size-6" />
      </span>
      <div className="min-w-0 flex-1">
        <h3 style={display} className="text-lg font-semibold leading-tight">
          {sample.name}
        </h3>
        <p className="text-sm text-[var(--muted)]">{sampleCategory}</p>
        <div className="mt-2 flex items-center gap-2">
          <span className="rounded-full bg-[var(--accent)] px-2.5 py-0.5 text-sm font-semibold text-[var(--on-accent)]">
            {sample.rating}
          </span>
          <span className="text-sm text-[var(--muted)]">{sample.date}</span>
        </div>
        <div className="mt-3">
          <Chip selected>{sample.occasion}</Chip>
        </div>
      </div>
    </article>
  );
}

function Controls() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex min-h-11 items-center rounded-[var(--radius-control)] bg-[var(--accent)] px-5 font-semibold text-[var(--on-accent)]">
          {strings.register.submit}
        </span>
        <span className="inline-flex min-h-11 items-center rounded-[var(--radius-control)] border border-[var(--border)] px-5 font-semibold text-[var(--text)]">
          Ver no mapa
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Chip selected>{strings.occasions.with_friends}</Chip>
        <Chip>{strings.occasions.with_family}</Chip>
        <Chip>{strings.occasions.solo}</Chip>
      </div>
    </div>
  );
}

function Legend({ direction, colors }: { direction: Direction; colors: ThemeColors }) {
  const shape = direction.id === "a" ? "rounded-sm" : "rounded-full";
  return (
    <div>
      <p className="text-sm font-medium">Lugares diferentes na cidade</p>
      <ol className="mt-2 grid grid-cols-4 gap-1.5">
        {colors.levels.map((color, i) => (
          <li key={color} className="flex flex-col gap-1">
            <span className={`h-3 ${shape}`} style={{ backgroundColor: color }} />
            <span className="text-xs text-[var(--muted)]">{levelLabels[i]}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Nav({ direction }: { direction: Direction }) {
  const active = navItems[0].href;

  if (direction.nav === "floating") {
    return (
      <div className="px-3 pb-3">
        <ul className="flex items-center justify-between rounded-full border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5">
          {navItems.map((item) =>
            item.highlight ? (
              <li key={item.href}>
                <span className="flex size-11 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--on-accent)] shadow-[0_0_20px_-4px_var(--accent)]">
                  <NavIconSvg icon={item.icon} />
                </span>
              </li>
            ) : (
              <li key={item.href}>
                <span
                  className={`flex min-h-11 items-center gap-1.5 rounded-full px-3 text-xs font-semibold ${
                    item.href === active ? "bg-[var(--soft)] text-[var(--on-soft)]" : "text-[var(--muted)]"
                  }`}
                >
                  <NavIconSvg icon={item.icon} />
                  {item.href === active ? item.label : <span className="sr-only">{item.label}</span>}
                </span>
              </li>
            ),
          )}
        </ul>
      </div>
    );
  }

  if (direction.nav === "minimal") {
    return (
      <ul className="flex items-end justify-around px-2 pb-3 pt-1">
        {navItems.map((item) => (
          <li key={item.href} className="flex flex-col items-center gap-1 text-xs">
            {item.highlight ? (
              <span className="flex size-11 items-center justify-center rounded-full border-2 border-[var(--accent)] text-[var(--accent)]">
                <NavIconSvg icon={item.icon} />
              </span>
            ) : (
              <span className={item.href === active ? "text-[var(--text)]" : "text-[var(--muted)]"}>
                <NavIconSvg icon={item.icon} />
              </span>
            )}
            <span className={item.href === active ? "font-semibold" : "text-[var(--muted)]"}>{item.label}</span>
            <span className={`size-1.5 rounded-full ${item.href === active ? "bg-[var(--accent)]" : "bg-transparent"}`} />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="flex items-end justify-around border-t border-[var(--border)] bg-[var(--surface)] px-2 pb-2 pt-1.5">
      {navItems.map((item) => (
        <li key={item.href} className="flex flex-col items-center gap-0.5 text-xs">
          {item.highlight ? (
            <span className="flex size-10 items-center justify-center rounded-[var(--radius-control)] bg-[var(--accent)] text-[var(--on-accent)]">
              <NavIconSvg icon={item.icon} />
            </span>
          ) : (
            <span
              className={`flex flex-col items-center border-t-2 pt-1 ${
                item.href === active ? "border-[var(--accent)] text-[var(--accent)]" : "border-transparent text-[var(--muted)]"
              }`}
            >
              <NavIconSvg icon={item.icon} />
            </span>
          )}
          <span className={item.href === active ? "font-semibold text-[var(--text)]" : "text-[var(--muted)]"}>
            {item.label}
          </span>
        </li>
      ))}
    </ul>
  );
}
