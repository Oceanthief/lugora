import type { Metadata, Viewport } from "next";

import { BottomNav } from "@/components/bottom-nav";
import { strings } from "@/content/pt-BR";
import { colors, tokensCss } from "@/lib/design-tokens";

import { urbanist } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: strings.app.name,
    template: `%s · ${strings.app.name}`,
  },
  description: strings.app.description,
  // No iPhone, o app instalado usa este nome e abre sem a barra do Safari.
  appleWebApp: {
    capable: true,
    title: strings.app.name,
    statusBarStyle: "default",
  },
};

// "cover" deixa o app usar a tela inteira no iPhone; a barra inferior
// compensa a área do gesto com env(safe-area-inset-bottom).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // Cor da barra de status, igual ao fundo do app em cada tema.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: colors.light.canvas },
    { media: "(prefers-color-scheme: dark)", color: colors.dark.canvas },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${urbanist.variable} h-full bg-canvas antialiased`}>
      <head>
        {/* Cores dos tokens (claro, escuro e data-theme), de design-tokens.ts. */}
        <style>{tokensCss()}</style>
      </head>
      <body className="relative h-dvh bg-canvas font-sans text-ink">
        {/* A barra inferior flutua por cima do conteúdo; a margem de baixo
            impede que ela cubra o fim da tela. */}
        <main className="relative h-full overflow-y-auto pb-[calc(6.5rem+env(safe-area-inset-bottom))]">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
