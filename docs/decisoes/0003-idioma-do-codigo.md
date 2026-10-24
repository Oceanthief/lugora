# 0003. Idioma: código em inglês, interface em português

- **Status:** proposta (aceitar ou mudar antes da Fatia 0)
- **Data:** 2026-10-23

## Contexto

O documento de visão foi escrito em português, inclusive os nomes do modelo de dados (`eh_morador`, `publicar_em`). O app é para o público brasileiro, mas o repositório é vitrine de portfólio, e as bibliotecas, mensagens de erro e exemplos do ecossistema estão em inglês.

## Opções consideradas

1. **Tudo em português:** fiel ao documento. Contra: identificadores sem acento ficam estranhos (`eh_morador`); mistura com APIs em inglês (`useState`, `select`); menor alcance para recrutadores de fora.
2. **Código e banco em inglês, interface e documentação em português, com glossário:** padrão de mercado, que conversa com o ecossistema. Contra: exige manter o glossário.
3. **Sem regra:** cada parte num idioma. Contra: inconsistência que se espalha rápido.

## Decisão

Opção 2. Código, banco e nomes de eventos em inglês, seguindo `docs/glossario.md`. Interface, documentação, commits e PRs em português do Brasil. As URLs do app ficam em português, porque são interface.

## Consequências

- Todo conceito novo entra primeiro no glossário e só depois vira tabela ou tipo.
- O Claude Code segue o glossário (regra no `CLAUDE.md`).
- O README pode ganhar uma versão em inglês quando o projeto for divulgado.
