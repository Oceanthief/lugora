// Fonte do Lugora (token --font-sans, direção C). O next/font baixa os arquivos
// no build e serve do próprio site: nenhum pedido vai ao Google quando alguém
// abre o app.

import { Urbanist } from "next/font/google";

export const urbanist = Urbanist({
  variable: "--font-urbanist",
  subsets: ["latin"],
  display: "swap",
});
