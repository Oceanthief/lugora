# Lugora · Documento de visão e diretrizes (v0.5.1)

Versão 0.5.1 · 23 de outubro de 2026 · Linha de base: mudanças só com evidência.

Este é o documento de visão do produto, dividido por seção para o Claude Code ler só o que cada fatia precisa. É a fonte da verdade do projeto: o Word é só uma exportação para compartilhar.

> **Nota de organização:** onde o texto fala em `docs/visao-produto.md` (seção 15), leia esta pasta. Onde fala em `ideias-para-depois.md`, o arquivo está em `docs/ideias-para-depois.md`.

> **Como usar este documento**
>
> - É a base para as decisões de produto e para o desenvolvimento no Claude Code. Cada decisão vem com o porquê.
> - A seção 2 analisa as suas seis contribuições. As seções 6 a 10 são a especificação que o Claude Code vai precisar.
> - Valores marcados como **parâmetro** são pontos de partida, não verdades: calibre com dados. O que ainda depende de definição está na seção 14.
> - **Documento congelado na v0.5.** Ideias novas vão para `ideias-para-depois.md` e só entram aqui com evidência da Fase 0 ou de dados de uso. Correções de risco (privacidade, segurança, dados errados) são exceção.

## Índice

- [1. O essencial](01-o-essencial.md)
- [2. Análise das suas contribuições](02-analise-das-suas-contribuicoes.md)
- [3. Problema, tese e concorrência](03-problema-tese-e-concorrencia.md)
- [4. Público e personas](04-publico-e-personas.md)
- [5. Princípios do produto](05-principios-do-produto.md)
- [6. Fases e escopo](06-fases-e-escopo.md)
- [7. Regras de negócio](07-regras/README.md)
  - [7.1 Visita (registro)](07-regras/01-visita-registro.md)
  - [7.2 Base de lugares, importação e deduplicação](07-regras/02-base-de-lugares-importacao-e-deduplicacao.md)
  - [7.3 Cidade e país](07-regras/03-cidade-e-pais.md)
  - [7.4 Mapa](07-regras/04-mapa.md)
  - [7.5 Publicação, visibilidade e atraso](07-regras/05-publicacao-visibilidade-e-atraso.md)
  - [7.6 Fotos](07-regras/06-fotos.md)
  - [7.7 Galeria do lugar (Fase 2)](07-regras/07-galeria-do-lugar-fase-2.md)
  - [7.8 Ocasiões e etiquetas](07-regras/08-ocasioes-e-etiquetas.md)
  - [7.9 Sequência semanal (Fase 2)](07-regras/09-sequencia-semanal-fase-2.md)
  - [7.10 Liberação da descoberta por cidade (Fase 3)](07-regras/10-liberacao-da-descoberta-por-cidade-fase-3.md)
  - [7.11 Índice morador × visitante (Fase 3)](07-regras/11-indice-morador-x-visitante-fase-3.md)
  - [7.12 Perfil de viajante](07-regras/12-perfil-de-viajante.md)
  - [7.13 Seguir e feed](07-regras/13-seguir-e-feed.md)
  - [7.14 Quero ir e listas](07-regras/14-quero-ir-e-listas.md)
  - [7.15 Convites e viagem em grupo (Fase 2)](07-regras/15-convites-e-viagem-em-grupo-fase-2.md)
- [8. Modelo de dados](08-modelo-de-dados.md)
- [9. Privacidade, segurança e LGPD](09-privacidade-seguranca-e-lgpd.md)
- [10. Arquitetura e stack](10-arquitetura-e-stack.md)
- [11. Fase 0: plano do teste concierge](11-fase-0-plano-do-teste-concierge.md)
- [12. Métricas do produto](12-metricas-do-produto.md)
- [13. Acessibilidade e design](13-acessibilidade-e-design.md)
- [14. Decisões em aberto](14-decisoes-em-aberto.md)
- [15. Do documento ao código](15-do-documento-ao-codigo.md)
- [16. Referências](16-referencias.md)
- [17. Histórico de versões](17-historico-de-versoes.md)
