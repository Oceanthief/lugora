/**
 * Lista fixa de ocasiões (seção 7.8). No banco, vira a tabela `tags`.
 *
 * Fica fora de mock-data.ts porque o formulário de registro, que roda no
 * navegador, precisa dela, e mock-data.ts só pode ser lido no servidor.
 */
export const occasions = [
  "romantic",
  "with_friends",
  "with_family",
  "solo",
  "work_study",
] as const;

export type Occasion = (typeof occasions)[number];
