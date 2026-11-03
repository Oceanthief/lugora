import { strings } from "@/content/pt-BR";
import { categoryIconPaths } from "@/lib/category-icons";
import { simulateColorVision, type ColorVision } from "@/lib/color-vision";
import { colors, type ColorToken, type Theme } from "@/lib/design-tokens";

// Cada amostra usa a classe do Tailwind do token (escrita por extenso, para o
// Tailwind gerar a classe), e não o valor: assim a prévia prova que as classes
// funcionam nos dois temas.
const swatches: { token: ColorToken; className: string }[] = [
  { token: "canvas", className: "bg-canvas" },
  { token: "surface", className: "bg-surface" },
  { token: "ink", className: "bg-ink" },
  { token: "ink-muted", className: "bg-ink-muted" },
  { token: "accent", className: "bg-accent" },
  { token: "on-accent", className: "bg-on-accent" },
  { token: "glow", className: "bg-glow" },
  { token: "on-glow", className: "bg-on-glow" },
  { token: "line", className: "bg-line" },
  { token: "danger", className: "bg-danger" },
];
const levelClasses = ["bg-level-1", "bg-level-2", "bg-level-3", "bg-level-4"];
const levelLabels = ["1", "2 a 5", "6 a 15", "16 ou mais"];
const themeLabels: Record<Theme, string> = { light: "Tema claro", dark: "Tema escuro" };
const visions: { vision: ColorVision | "normal"; label: string }[] = [
  { vision: "normal", label: "Visão normal" },
  { vision: "protanopia", label: "Protanopia (sem vermelho)" },
  { vision: "deuteranopia", label: "Deuteranopia (sem verde)" },
  { vision: "tritanopia", label: "Tritanopia (sem azul)" },
  { vision: "achromatopsia", label: "Acromatopsia (sem cor)" },
];

export function TokensPreview() {
  return (
    <section aria-labelledby="tokens-title" className="max-w-3xl">
      <h2 id="tokens-title" className="text-2xl font-semibold">
        Tokens da direção C
      </h2>
      <p className="mt-1 text-zinc-700 dark:text-zinc-300">
        Cores, fonte, raios e brilho já como classes do Tailwind. Cada quadro força um tema com data-theme.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {(["light", "dark"] as const).map((theme) => (
          <div
            key={theme}
            data-theme={theme}
            className="flex flex-col gap-5 rounded-card border border-line bg-canvas p-4 font-sans text-ink"
          >
            <p className="text-sm text-ink-muted">{themeLabels[theme]}</p>

            <ul className="grid grid-cols-5 gap-2">
              {swatches.map(({ token, className }) => (
                <li key={token} className="text-[11px] leading-tight">
                  <span className={`block h-9 rounded-lg border border-line ${className}`} />
                  <span className="mt-1 block font-semibold">{token}</span>
                  <span className="block text-ink-muted">{colors[theme][token]}</span>
                </li>
              ))}
            </ul>

            <article className="flex gap-3 rounded-card bg-surface p-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-glow text-accent shadow-glow">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-6"
                >
                  {categoryIconPaths.brewery.map((path) => (
                    <path key={path} d={path} />
                  ))}
                </svg>
              </span>
              <div className="min-w-0">
                <h3 className="text-lg font-semibold leading-tight">Cervejaria Württemberg</h3>
                <p className="text-sm text-ink-muted">Cervejaria em Juiz de Fora</p>
                <p className="mt-2 flex items-center gap-2">
                  <span className="rounded-control bg-accent px-2.5 py-0.5 text-sm font-semibold text-on-accent">4,5</span>
                  <span className="text-sm text-ink-muted">12/10/2026</span>
                </p>
                <p className="mt-3">
                  <span className="inline-flex min-h-9 items-center rounded-control bg-glow px-3 text-sm font-medium text-on-glow">
                    {strings.occasions.with_friends}
                  </span>
                </p>
              </div>
            </article>

            <p className="text-sm text-danger">{strings.register.errors.placeRequired}</p>

            <div>
              <p className="text-sm font-medium">Lugares diferentes na cidade</p>
              <ol className="mt-2 grid grid-cols-4 gap-1.5">
                {levelClasses.map((className, i) => (
                  <li key={className} className="flex flex-col gap-1">
                    <span className={`h-3 rounded-control border border-line ${className}`} />
                    <span className="text-xs text-ink-muted">{levelLabels[i]}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        ))}
      </div>

      <h3 className="mt-8 text-lg font-semibold">Faixas do mapa com daltonismo</h3>
      <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
        Simulação (Machado e colegas, 2009). Em todas, cada faixa continua diferente da vizinha.
      </p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-zinc-600 dark:text-zinc-400">
            <tr>
              <th scope="col" className="py-1 pr-3 font-medium">Visão</th>
              <th scope="col" className="py-1 pr-3 font-medium">Claro</th>
              <th scope="col" className="py-1 font-medium">Escuro</th>
            </tr>
          </thead>
          <tbody>
            {visions.map(({ vision, label }) => (
              <tr key={vision} className="border-t border-zinc-200 dark:border-zinc-800">
                <th scope="row" className="py-2 pr-3 font-normal">{label}</th>
                {(["light", "dark"] as const).map((theme) => (
                  <td key={theme} className="py-2 pr-3">
                    <span className="flex gap-1">
                      {(["level-1", "level-2", "level-3", "level-4"] as const).map((level) => {
                        const color = colors[theme][level];
                        return (
                          <span
                            key={level}
                            className="h-5 w-6 rounded border border-zinc-300 dark:border-zinc-600"
                            style={{ backgroundColor: vision === "normal" ? color : simulateColorVision(color, vision) }}
                          />
                        );
                      })}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
