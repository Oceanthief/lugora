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
