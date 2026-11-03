# 0002. Estrutura do repositório

- **Status:** aceita (Fatia 0)
- **Data:** 2026-10-23

## Contexto

O projeto tem três partes com ferramentas diferentes: o app (Node e TypeScript), o banco (SQL e Supabase CLI) e os pipelines de dados (Python e DuckDB). A documentação e a configuração do Claude Code precisam ficar na raiz. O `create-next-app` exige uma pasta vazia para criar o app.

## Opções consideradas

1. **Um repositório com pastas por camada** (`web/`, `supabase/`, `pipelines/`, `docs/`): cada parte isolada, regras do Claude Code por pasta, e quem visita o GitHub vê as camadas de cara. Contra: os comandos rodam em pastas diferentes.
2. **App Next.js na raiz:** comandos mais curtos. Contra: mistura código do app com pipelines e documentação, e o `create-next-app` não roda numa pasta que já tem arquivos.
3. **Repositórios separados:** isolamento total. Contra: três lugares para manter e o histórico do projeto fragmentado.
4. **Monorepo com ferramentas (npm workspaces, Turborepo):** padrão em equipes grandes. Contra: complexidade sem benefício para um app só.

## Decisão

Opção 1.

```
lugora/
├── web/           app Next.js (Fatia 0)
├── supabase/      migrações, seed, testes pgTAP (Fatia 2)
├── pipelines/     Python + DuckDB (base de lugares)
├── docs/          visão, roadmap, decisões, glossário, design
├── .claude/       regras, skills e subagentes do Claude Code
└── .github/       CI, modelos de PR e issue, Dependabot
```

## Consequências

- As regras do Claude Code por camada ficam em `.claude/rules/` com `paths`, e só carregam quando ele mexe naquela pasta.
- A Vercel precisa da configuração "Root Directory = web".
- A CI tem um job por camada, e cada job só roda quando a pasta existe.
