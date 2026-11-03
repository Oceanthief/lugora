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

Veja o [guia de início](docs/guia-de-inicio.md) para instalar as ferramentas. Depois, com o Docker Desktop aberto:

```bash
npm install                 # na raiz: a CLI do Supabase
npx supabase start          # o banco local, com o seed
cd web
npm install
npm run env:local           # cria o .env.local
npm run dev
```

Abra http://localhost:3000. O login é por código de 6 dígitos, e os e-mails de teste chegam em http://127.0.0.1:54324. Para a busca achar todas as cidades, carregue-as com o [pipeline](pipelines/overture/README.md); sem ele, só existe Juiz de Fora.

## Dados de demonstração

O login, o cadastro e o perfil já usam o banco. As telas de mapa, feed, registro e "Quero ir" ainda rodam com dados de demonstração:

- **Lugares reais:** 100 lugares de Juiz de Fora, da base aberta do [Overture Maps](https://overturemaps.org/). Foram escolhidos pelo script de curadoria `selecionar_lugares.py` (filtro de qualidade, categorias, exclusão de grandes redes e duplicatas) e tiveram os nomes revisados à mão. O resultado está em [`data/seed/lugares_jf_seed.csv`](data/seed/README.md).
- **O resto é fictício:** usuários, quem segue quem, visitas, notas, tags e a lista "Quero ir" são gerados por script. Nessas telas, o usuário principal leva o nome do autor (Victor Ramos), mas as visitas dele também são de demonstração. **As notas não são avaliações reais desses estabelecimentos.**

Para recriar os dados (em `web/`):

```bash
npm run seed:lugares   # importa o CSV para web/src/data/places.json
npm run seed:demo      # gera usuários, visitas e "Quero ir" em web/src/data/demo.json
```

Os dois comandos podem ser repetidos sem duplicar nada. O `seed:demo` usa semente fixa (42) e gera sempre o mesmo resultado; rode-o de novo sempre que os lugares mudarem.

## Dados e atribuição

Dados de lugares © Overture Maps Foundation e contribuidores. Mapas e limites © OpenStreetMap contributors.

## Licença

Ainda não definida. Até lá, todos os direitos reservados.
