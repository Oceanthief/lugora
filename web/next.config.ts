import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // O botão do Next (só em desenvolvimento) fica no canto de baixo por padrão
  // e cobre a aba Mapa da barra inferior.
  devIndicators: { position: "top-right" },
  // Só vale para `npm run dev`: libera abrir o app pelo celular na mesma
  // Wi-Fi (http://IP-do-PC:3000). Cada * é um pedaço do IP, então cobre as
  // redes de casa mesmo quando o roteador troca o IP do PC.
  allowedDevOrigins: ["192.168.*.*"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
