# Lugora

> Guarde no mapa cada lugar que você conheceu, e descubra cada cidade pelos olhos de quem mora nela.

**Status:** em construção (Fase 1). Acompanhe pelo [roadmap](docs/roadmap.md).

O Lugora é um app web instalável no celular para registrar os lugares que você visita, em viagem ou na sua própria cidade, avaliá-los e ver o seu mapa pessoal se preencher. O diferencial é separar quem recomenda: o app sabe se uma avaliação veio de um morador ou de um visitante, e mostra isso com regras claras de privacidade.

## Stack

- **App:** Next.js (TypeScript, Tailwind), PWA mobile-first
- **Banco e login:** Supabase (PostgreSQL + PostGIS, Auth, Storage), com regras de acesso (RLS) testadas com pgTAP
- **Mapa:** MapLibre GL JS + OpenFreeMap
- **Dados:** Python + DuckDB sobre o Overture Maps ([diagnóstico de Juiz de Fora](pipelines/overture/README.md))

## Estrutura

```
web/         app (Next.js)
supabase/    migrações, seed e testes do banco
pipelines/   importação e diagnóstico da base de lugares
docs/        visão do produto, roadmap, decisões técnicas, glossário
```

## Documentação

- [Visão do produto (v0.5.1)](docs/visao/README.md)
- [Roadmap](docs/roadmap.md)
- [Decisões técnicas](docs/decisoes/README.md)
- [Guia de início](docs/guia-de-inicio.md)
- [Prompts por fatia](docs/prompts.md)

## Como rodar

Disponível a partir da Fatia 0. Veja o [guia de início](docs/guia-de-inicio.md).

## Dados e atribuição

Dados de lugares © Overture Maps Foundation e contribuidores. Mapas e limites © OpenStreetMap contributors.

## Licença

Ainda não definida. Até lá, todos os direitos reservados.
