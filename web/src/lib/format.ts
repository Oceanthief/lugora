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
