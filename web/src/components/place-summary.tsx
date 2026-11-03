import { CategoryIcon } from "@/components/category-icon";
import { strings } from "@/content/pt-BR";
import type { MockCity, MockPlace } from "@/lib/mock-data";

/** Ícone, nome do lugar e "categoria · cidade". Usado nas listas. */
export function PlaceSummary({
  place,
  city,
}: {
  place: MockPlace;
  city: MockCity;
}) {
  return (
    <div className="flex items-center gap-3">
      <CategoryIcon category={place.category} />
      <div className="min-w-0">
        <p className="truncate font-semibold">{place.name}</p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {strings.categories[place.category]} · {city.name}
        </p>
      </div>
    </div>
  );
}
