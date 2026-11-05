import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // O botão do Next (só em desenvolvimento) fica no canto de baixo por padrão
  // e cobre a aba Mapa da barra inferior.
  devIndicators: { position: "top-right" },
  // Em desenvolvimento, o Next escreve no terminal os argumentos de cada Server
  // Action, o que incluiria o e-mail do login e a posição do GPS (seção 9.1).
  logging: { serverFunctions: false },
  // Só vale para `npm run dev`: libera abrir o app pelo celular na mesma
  // Wi-Fi (http://IP-do-PC:3000). Cada * é um pedaço do IP, então cobre as
  // redes de casa mesmo quando o roteador troca o IP do PC.
  allowedDevOrigins: ["192.168.*.*"],
  // A raiz do repositório tem um package.json só para a CLI do Supabase. Sem as
  // duas opções apontando para web/, o Next toma aquela pasta como raiz do app;
  // com só uma delas, ele grava o build em web/web/.next.
  outputFileTracingRoot: __dirname,
  turbopack: {
    root: __dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
