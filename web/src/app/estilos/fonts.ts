// Fontes das três direções. O next/font baixa os arquivos no build e serve do
// próprio site: nenhum pedido vai ao Google quando alguém abre o app.

import { Hanken_Grotesk, Newsreader, Overpass, Urbanist } from "next/font/google";

import type { Direction } from "./directions";

const overpass = Overpass({ subsets: ["latin"], display: "swap" });
const newsreader = Newsreader({ subsets: ["latin"], display: "swap" });
const hankenGrotesk = Hanken_Grotesk({ subsets: ["latin"], display: "swap" });
const urbanist = Urbanist({ subsets: ["latin"], display: "swap" });

export type DirectionFonts = { display: string; body: string };

export const directionFonts: Record<Direction["id"], DirectionFonts> = {
  a: { display: overpass.style.fontFamily, body: overpass.style.fontFamily },
  b: { display: newsreader.style.fontFamily, body: hankenGrotesk.style.fontFamily },
  c: { display: urbanist.style.fontFamily, body: urbanist.style.fontFamily },
};
