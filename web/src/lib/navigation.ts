import { strings } from "../content/pt-BR";

export type NavIcon = "map" | "feed" | "register" | "wantToGo" | "profile";

export type NavItem = {
  href: string;
  label: string;
  icon: NavIcon;
  /** Botão central em destaque (Registrar). */
  highlight?: boolean;
};

/** Itens da barra inferior, na ordem em que aparecem. */
export const navItems: readonly NavItem[] = [
  { href: "/mapa", label: strings.nav.map, icon: "map" },
  { href: "/feed", label: strings.nav.feed, icon: "feed" },
  {
    href: "/registrar",
    label: strings.nav.register,
    icon: "register",
    highlight: true,
  },
  { href: "/quero-ir", label: strings.nav.wantToGo, icon: "wantToGo" },
  { href: "/perfil", label: strings.nav.profile, icon: "profile" },
];

/**
 * Diz se a aba `href` deve aparecer ativa no endereço atual.
 *
 * Vale para a própria rota e para as rotas filhas (`/perfil/victor`
 * ativa Perfil), mas não para rotas que só começam com o mesmo texto.
 */
export function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
