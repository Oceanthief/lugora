import { categoryIconPaths } from "@/lib/category-icons";
import type { PlaceCategory } from "@/lib/mock-data";

/**
 * Ícone da categoria num círculo, o mesmo desenho dos pontos do mapa.
 * Decorativo (`aria-hidden`): o nome da categoria aparece em texto ao lado.
 */
export function CategoryIcon({ category }: { category: PlaceCategory }) {
  return (
    <span
      aria-hidden="true"
      className="flex size-10 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950"
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
        {categoryIconPaths[category].map((path) => (
          <path key={path} d={path} />
        ))}
      </svg>
    </span>
  );
}
