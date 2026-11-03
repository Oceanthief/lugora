import type { MetadataRoute } from "next";

import { strings } from "@/content/pt-BR";

/**
 * Manifesto do PWA: o que o celular precisa para instalar o Lugora na tela
 * inicial (nome, ícones, tela de abertura). O Next o serve em
 * /manifest.webmanifest e põe o link no <head> de todas as páginas.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: strings.app.name,
    short_name: strings.app.name,
    description: strings.app.description,
    lang: "pt-BR",
    start_url: "/mapa",
    scope: "/",
    // Abre em tela cheia, sem a barra de endereço do navegador.
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    // Ícones provisórios até a Fatia 1. O "maskable" tem margem para o
    // Android recortar no formato que quiser (círculo, gota etc.).
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
