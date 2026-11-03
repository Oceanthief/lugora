/**
 * Formata a nota de uma visita para exibição (0,5 a 5, passo 0,5).
 *
 * O Intl cuida do separador decimal do português: 4.5 vira "4,5".
 */
export function formatRating(rating: number): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(rating);
}

/**
 * Formata a data de uma visita (AAAA-MM-DD) no padrão brasileiro: 23/10/2026.
 *
 * Monta o texto direto, sem `new Date()`: "2026-10-23" vira meia-noite em UTC,
 * que no horário de Brasília ainda é dia 22.
 */
export function formatVisitDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

/**
 * O dia de `date` no fuso do aparelho, como AAAA-MM-DD.
 *
 * Não usa toISOString(), que converte para UTC: às 23h em Brasília, já seria
 * o dia seguinte.
 */
export function toISODate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

const countryNames = new Intl.DisplayNames("pt-BR", { type: "region" });

/** Nome do país em português a partir do código: "PT" vira "Portugal". */
export function formatCountryName(countryCode: string): string {
  return countryNames.of(countryCode) ?? countryCode;
}

/** Site de um link "onde eu vi", sem o "www.": "instagram.com". */
export function formatSourceHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
