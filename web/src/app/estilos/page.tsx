import type { Metadata } from "next";

import { contrastRatio, MIN_TEXT_CONTRAST } from "@/lib/contrast";

import { directions, textPairs, type Direction, type ThemeColors } from "./directions";
import { directionFonts, type DirectionFonts } from "./fonts";
import { ThemePreview } from "./previews";

// Página temporária da Fatia 1: sai do app quando uma direção for escolhida.
export const metadata: Metadata = { title: "Estilos" };

const themes = [
  { key: "light", label: "Tema claro" },
  { key: "dark", label: "Tema escuro" },
] as const;

export default function StylesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="text-2xl font-semibold">Três direções para o Lugora</h1>
      <p className="mt-1 max-w-prose text-zinc-600 dark:text-zinc-400">
        Compare as três e escolha uma, ou peça uma mistura. Todas usam a mesma visita de exemplo.
      </p>
      <nav aria-label="Direções" className="mt-4 flex flex-wrap gap-2">
        {directions.map((direction) => (
          <a
            key={direction.id}
            href={`#${direction.id}`}
            className="flex min-h-11 items-center rounded-full border border-zinc-300 px-4 text-sm font-medium dark:border-zinc-700"
          >
            {direction.id.toUpperCase()}. {direction.name}
          </a>
        ))}
      </nav>

      <div className="mt-8 grid gap-12 lg:grid-cols-3 lg:gap-8">
        {directions.map((direction) => (
          <DirectionSection key={direction.id} direction={direction} fonts={directionFonts[direction.id]} />
        ))}
      </div>
    </div>
  );
}

function DirectionSection({ direction, fonts }: { direction: Direction; fonts: DirectionFonts }) {
  return (
    <section id={direction.id} aria-labelledby={`${direction.id}-title`} className="scroll-mt-4">
      <h2 id={`${direction.id}-title`} style={{ fontFamily: fonts.display }} className="text-3xl font-semibold">
        {direction.id.toUpperCase()}. {direction.name}
      </h2>
      <dl className="mt-3 flex flex-col gap-2 text-sm">
        {[
          ["A ideia", direction.idea],
          ["Para quem funciona", direction.forWhom],
          ["O risco", direction.risk],
        ].map(([term, description]) => (
          <div key={term}>
            <dt className="font-semibold">{term}</dt>
            <dd className="text-zinc-700 dark:text-zinc-300">{description}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-5">
        <p style={{ fontFamily: fonts.display }} className="text-2xl font-semibold leading-tight">
          Cervejaria Württemberg
        </p>
        <p style={{ fontFamily: fonts.body }} className="mt-1 text-zinc-700 dark:text-zinc-300">
          Registre os lugares que você visita e veja o seu mapa se preencher.
        </p>
        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{direction.typefaces}</p>
      </div>

      <div className="mt-5 flex flex-col gap-2">
        {themes.map(({ key, label }) => (
          <Palette key={key} label={label} colors={direction[key]} names={direction.colorNames[key]} />
        ))}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        {themes.map(({ key, label }) => (
          <ThemePreview key={key} label={label} direction={direction} colors={direction[key]} fonts={fonts} />
        ))}
      </div>

      <ContrastTable direction={direction} />
    </section>
  );
}

function Palette({ label, colors, names }: { label: string; colors: ThemeColors; names: Direction["colorNames"]["light"] }) {
  const swatches = [colors.canvas, colors.surface, colors.text, colors.accent, colors.soft];
  return (
    <div>
      <p className="text-xs text-zinc-600 dark:text-zinc-400">{label}</p>
      <ul className="mt-1 grid grid-cols-5 gap-1.5">
        {swatches.map((color, i) => (
          <li key={names[i]} className="text-[11px] leading-tight">
            <span
              className="block h-10 rounded-md border border-zinc-200 dark:border-zinc-700"
              style={{ backgroundColor: color }}
            />
            <span className="mt-1 block font-medium">{names[i]}</span>
            <span className="block text-zinc-600 dark:text-zinc-400">{color}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ContrastTable({ direction }: { direction: Direction }) {
  return (
    <div className="mt-5 overflow-x-auto">
      <table className="w-full text-left text-sm">
        <caption className="mb-2 text-left font-semibold">Contraste (meta: 4,5:1)</caption>
        <thead className="text-xs text-zinc-600 dark:text-zinc-400">
          <tr>
            <th scope="col" className="py-1 pr-2 font-medium">Par</th>
            <th scope="col" className="py-1 pr-2 font-medium">Claro</th>
            <th scope="col" className="py-1 font-medium">Escuro</th>
          </tr>
        </thead>
        <tbody>
          {textPairs(direction.light).map((pair, i) => {
            const darkPair = textPairs(direction.dark)[i];
            return (
              <tr key={pair.label} className="border-t border-zinc-200 dark:border-zinc-800">
                <th scope="row" className="py-1.5 pr-2 font-normal">{pair.label}</th>
                <td className="py-1.5 pr-2">{formatRatio(contrastRatio(pair.fg, pair.bg))}</td>
                <td className="py-1.5">{formatRatio(contrastRatio(darkPair.fg, darkPair.bg))}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function formatRatio(ratio: number): string {
  const value = ratio.toFixed(1).replace(".", ",");
  return ratio >= MIN_TEXT_CONTRAST ? `${value}:1` : `${value}:1 (abaixo da meta)`;
}
