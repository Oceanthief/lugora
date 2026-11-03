"use client";

// Client Component porque precisa saber o endereço atual (usePathname) para
// marcar a aba ativa. O resto do layout continua sendo Server Component.

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NavIconSvg } from "@/components/nav-icons";
import { strings } from "@/content/pt-BR";
import { isActivePath, navItems } from "@/lib/navigation";

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

/**
 * Barra inferior em pílula, flutuando sobre o conteúdo (direção C). A aba
 * ativa mostra ícone e nome; as outras, só o ícone, com o nome para leitores
 * de tela. O Registrar é o botão aceso.
 */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label={strings.nav.label}
      className="pointer-events-none absolute inset-x-0 bottom-0 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
    >
      <ul className="pointer-events-auto mx-auto flex max-w-md items-center justify-between rounded-control border border-line bg-surface px-2 py-1.5">
        {navItems.map((item) => {
          const active = isActivePath(pathname, item.href);

          if (item.highlight) {
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex size-12 items-center justify-center rounded-control bg-accent text-on-accent shadow-glow ${focusRing}`}
                >
                  <NavIconSvg icon={item.icon} />
                  <span className="sr-only">{item.label}</span>
                </Link>
              </li>
            );
          }

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-control px-3 text-sm font-semibold ${focusRing} ${
                  active ? "bg-glow text-on-glow" : "text-ink-muted"
                }`}
              >
                <NavIconSvg icon={item.icon} />
                <span className={active ? undefined : "sr-only"}>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
