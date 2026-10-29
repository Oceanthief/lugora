# Lugora

App web instalável (PWA) para registrar lugares visitados, em viagem ou na própria cidade, avaliá-los e ver o mapa pessoal se preencher. O diferencial é o índice morador × visitante. É um projeto de portfólio, construído em fatias verticais: cada fatia entrega uma funcionalidade completa, da tela ao banco.

## Onde está cada coisa

- **O que fazer agora:** `docs/roadmap.md`. A fatia atual é a que está com status "em andamento".
- **Visão e regras do produto:** `docs/visao/` (índice em `docs/visao/README.md`). Leia só as seções que a fatia cita, nunca o documento inteiro.
- **Decisões técnicas:** `docs/decisoes/` (ADRs).
- **Nomes no código e no banco:** `docs/glossario.md`.
- **Ideias que ainda não entram:** `docs/ideias-para-depois.md`.
- **Identidade visual** (a partir da Fatia 1): `docs/design/identidade.md`.

## Como trabalhar

1. Uma fatia por vez. Antes de codar, leia a fatia no roadmap e as seções que ela cita. Proponha um plano curto e espere aprovação.
2. Nada fora da fatia atual. Ideia ou necessidade fora do escopo: registre com a skill `ideia` e siga em frente.
3. Implemente uma ideia de `docs/ideias-para-depois.md` só quando ela tiver sido promovida para o roadmap.
4. O documento de visão está congelado na v0.5.1. Se uma tarefa exigir mudar uma regra de produto, pare e pergunte. Decisão técnica nova vira ADR (skill `adr`).
5. Uma fatia só termina quando cumpre a "Definição de pronto" do roadmap: testes, lint, tipos e build passando, roadmap atualizado e um passo a passo do que conferir no localhost.
6. Mostre evidência em vez de afirmar: a saída dos testes, o comando que rodou, um print da tela.
7. O Victor está aprendendo e revisa cada mudança. Prefira soluções simples e padrão do ecossistema, justifique cada dependência nova e explique conceitos novos em poucas linhas.
8. Git: uma branch por fatia (`fatia/NN-nome-curto`), commits pequenos com mensagem em português no imperativo ("Adiciona busca de lugares"). Nunca use `push --force` na `main`.

## Regras inegociáveis (privacidade e segurança)

Base: `docs/visao/09-privacidade-seguranca-e-lgpd.md`.

- Toda tabela no schema `public` tem RLS ativo, políticas por operação e teste pgTAP de acesso por outro usuário.
- Views expostas pela API usam `WITH (security_invoker = true)`. Views materializadas e tabelas agregadas ficam fora do schema `public`.
- Um número mostrado a alguém só pode ser calculado com visitas que essa pessoa tem permissão de ver. Números públicos usam só visitas públicas. O percentual de moradores exige pelo menos 5 pessoas por grupo.
- Respeite `visibility` e `publish_at` em toda consulta de feed, perfil, galeria e página de lugar. Mostre a data da visita, nunca a hora.
- Visita a lugar de categoria sensível nasce "só eu".
- Fotos: remova todos os metadados (EXIF) no servidor antes de salvar. Nunca guarde o arquivo original.
- A chave `service_role` e a senha do banco só existem em scripts de `pipelines/`, rodando na máquina local. Nunca em `web/`, nunca em variável `NEXT_PUBLIC_*`.
- Nunca leia, imprima ou commite arquivos `.env*`, exceto `.env.example`.
- Público 18+.

## Estrutura do repositório

- `web/`: app Next.js (App Router, TypeScript, Tailwind), mobile-first. Criado na Fatia 0.
- `supabase/`: migrações SQL, seed com dados fictícios, testes pgTAP em `supabase/tests/`. Criado na Fatia 2.
- `pipelines/overture/`: Python + DuckDB. Diagnóstico e importação da base de lugares.
- `docs/`: visão, roadmap, decisões, glossário, design.

## Comandos

Atualize esta seção sempre que um comando mudar.

- App: `cd web` e `npm run dev`, depois abrir http://localhost:3000. Use sempre `npm run dev`/`npm run build`, não `next dev` direto: eles copiam antes o worker do MapLibre para `public/` (ADR 0006); sem ele, o mapa fica em branco.
- Qualidade (em `web/`): `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`
- Banco local (a partir da Fatia 2, na raiz): `npx supabase start`, `npx supabase db reset`, `npx supabase test db`. Studio em http://127.0.0.1:54323
- Pipeline (em `pipelines/overture/`): `python relatorio_jf.py`

## Ambiente

- Windows, com PowerShell ou Git Bash. O repositório fica fora do OneDrive.
- No celular, o GPS exige HTTPS: use o deploy de preview. Em `http://IP-do-PC:3000` o navegador bloqueia a localização.
- Celular na mesma Wi-Fi: `npm run dev` e abrir `http://IP-do-PC:3000`, com o IP do adaptador Wi-Fi (`ipconfig`, geralmente `192.168.…`). O endereço "Network" que o Next mostra pode ser de outro adaptador de rede (VPN, módulo de segurança), que não serve. Pela Wi-Fi o app abre, mas só instala com HTTPS (preview da Vercel).

## Idioma

- Interface, documentação, commits e PRs: português do Brasil. URLs do app em português (`/mapa`, `/registrar`).
- Código e banco: inglês, seguindo `docs/glossario.md` (ADR 0003).
