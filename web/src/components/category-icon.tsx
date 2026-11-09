import { iconPathsFor } from "@/lib/category-icons";

/**
 * Ícone da categoria num quadrado âmbar suave, o mesmo desenho dos pontos do
 * mapa. Sem brilho: numa lista, só o botão Registrar fica "aceso".
 * Decorativo (`aria-hidden`): o nome da categoria aparece em texto ao lado.
 * Categoria desconhecida ou vazia ganha o alfinete genérico.
 */
export function CategoryIcon({ category }: { category: string | null }) {
  return (
    <span
      aria-hidden="true"
      className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-glow text-accent"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-5"
      >
        {iconPathsFor(category).map((path) => (
          <path key={path} d={path} />
        ))}
      </svg>
    </span>
  );
}
