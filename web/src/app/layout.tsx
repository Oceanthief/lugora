import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { BottomNav } from "@/components/bottom-nav";
import { strings } from "@/content/pt-BR";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: strings.app.name,
    template: `%s · ${strings.app.name}`,
  },
  description: strings.app.description,
};

// "cover" deixa o app usar a tela inteira no iPhone; a barra inferior
// compensa a área do gesto com env(safe-area-inset-bottom).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex h-dvh flex-col">
        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
