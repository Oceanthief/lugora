// Fontes das três direções. O next/font baixa os arquivos no build e serve do
// próprio site: nenhum pedido vai ao Google quando alguém abre o app.

import { Hanken_Grotesk, Newsreader, Overpass } from "next/font/google";

import { urbanist } from "../fonts";
import type { Direction } from "./directions";

const overpass = Overpass({ subsets: ["latin"], display: "swap" });
const newsreader = Newsreader({ subsets: ["latin"], display: "swap" });
const hankenGrotesk = Hanken_Grotesk({ subsets: ["latin"], display: "swap" });

/** Fonte dos títulos, do texto corrido e do número da nota. */
export type DirectionFonts = { display: string; body: string; numeral: string };

export const directionFonts: Record<Direction["id"], DirectionFonts> = {
  a: { display: overpass.style.fontFamily, body: overpass.style.fontFamily, numeral: overpass.style.fontFamily },
  b: { display: newsreader.style.fontFamily, body: hankenGrotesk.style.fontFamily, numeral: newsreader.style.fontFamily },
  c: { display: urbanist.style.fontFamily, body: urbanist.style.fontFamily, numeral: urbanist.style.fontFamily },
  d: { display: overpass.style.fontFamily, body: overpass.style.fontFamily, numeral: newsreader.style.fontFamily },
};
