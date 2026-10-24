---
name: adr
description: Cria um registro de decisão técnica (ADR) do Lugora em docs/decisoes/.
argument-hint: "<título da decisão>"
---

Crie um ADR para "$ARGUMENTS":

1. Use o próximo número livre em `docs/decisoes/` (4 dígitos) e o nome `NNNN-titulo-em-kebab-case.md`, seguindo `docs/decisoes/0000-modelo.md`.
2. Preencha contexto, opções consideradas (com prós e contras), decisão e consequências. Linguagem simples, até uma página.
3. Status "proposta". Depois que o Victor aprovar, mude para "aceita".
4. Adicione a linha no índice de `docs/decisoes/README.md`.
5. Se a decisão substitui outra, marque a antiga como "substituída por NNNN".
