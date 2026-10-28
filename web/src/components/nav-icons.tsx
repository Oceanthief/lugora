import type { ReactNode } from "react";

import type { NavIcon } from "@/lib/navigation";

/**
 * Ícones provisórios da barra inferior, em SVG direto no código para não
 * depender de uma biblioteca. A identidade visual da Fatia 1 pode trocá-los.
 *
 * São decorativos (`aria-hidden`): o nome da aba aparece em texto ao lado.
 */
const paths: Record<NavIcon, ReactNode> = {
  map: (
    <>
      <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z" />
      <path d="M9 4v14M15 6v14" />
    </>
  ),
  feed: (
    <>
      <rect x="4" y="4" width="16" height="7" rx="1.5" />
      <rect x="4" y="13" width="16" height="7" rx="1.5" />
    </>
  ),
  register: <path d="M12 5v14M5 12h14" />,
  wantToGo: <path d="M6 4h12v16l-6-4-6 4V4Z" />,
  profile: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c1.5-4 4.5-6 8-6s6.5 2 8 6" />
    </>
  ),
};

export function NavIconSvg({ icon }: { icon: NavIcon }) {
  return (
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
      {paths[icon]}
    </svg>
  );
}
