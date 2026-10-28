"use client";

// Client Component porque precisa saber o endereço atual (usePathname) para
// marcar a aba ativa. O resto do layout continua sendo Server Component.

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NavIconSvg } from "@/components/nav-icons";
import { strings } from "@/content/pt-BR";
import { isActivePath, navItems } from "@/lib/navigation";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label={strings.nav.label}
      className="border-t border-zinc-200 bg-white pb-[env(safe-area-inset-bottom)] dark:border-zinc-800 dark:bg-zinc-950"
    >
      <ul className="mx-auto flex max-w-md items-end justify-around px-2">
        {navItems.map((item) => {
          const active = isActivePath(pathname, item.href);

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-14 flex-col items-center justify-end gap-0.5 py-1.5 text-xs font-medium ${
                  active
                    ? "text-zinc-950 dark:text-white"
                    : "text-zinc-600 dark:text-zinc-400"
                }`}
              >
                {item.highlight ? (
                  <span
                    className={`-mt-5 flex size-12 items-center justify-center rounded-full shadow-md ${
                      active
                        ? "bg-zinc-950 text-white ring-4 ring-zinc-300 dark:bg-white dark:text-zinc-950 dark:ring-zinc-700"
                        : "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950"
                    }`}
                  >
                    <NavIconSvg icon={item.icon} />
                  </span>
                ) : (
                  <NavIconSvg icon={item.icon} />
                )}
                <span className={active ? "font-semibold" : undefined}>
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
