# Roadmap do Lugora

Este roadmap transforma o documento de visão (`docs/visao/`) em passos de construção. Cada passo é uma **fatia vertical**: uma funcionalidade completa, da tela ao banco, que termina com algo que você consegue ver e usar no localhost. É o contrário de fazer todas as telas primeiro e o banco depois.

**Como usar:**

- No Claude Code, `/fatia N` começa a fatia N, e `/fechar-fatia` encerra a fatia atual. Os prompts prontos de cada fatia estão em [prompts.md](prompts.md).
- Status de cada fatia: **a fazer**, **em andamento** ou **concluída**. Só uma fica em andamento por vez.
- Tamanho: **P** (pequena), **M** (média) ou **G** (grande). Se uma fatia passar de duas semanas no seu ritmo, quebre em duas (por exemplo, 4a e 4b) e registre aqui.
- Ideia nova não muda este arquivo: vai para `docs/ideias-para-depois.md` (skill `ideia`). O roadmap só muda quando uma ideia é promovida.

## Visão geral

O projeto anda em duas trilhas paralelas, como decidido na seção 2.1 do documento:

- **Trilha A, comportamento:** a Fase 0 (teste concierge). Quase sem código, valida se as pessoas registram lugares sem cobrança.
- **Trilha B, produto:** as fatias abaixo.

As duas se encontram no **portão do beta**, depois da Fatia 10.

| Fatia | Nome | O que você vê no fim | Tam. | Depende de | Status |
| --- | --- | --- | --- | --- | --- |
| 0 | Esqueleto no localhost | App com navegação, telas de exemplo e mapa de JF | M | — | a fazer |
| 1 | Direção visual | Três estilos lado a lado em `/estilos`; você escolhe um | P | 0 | a fazer |
| 2 | Banco local e contas | Entrar, fazer o cadastro e ver o próprio perfil | G | 0 | a fazer |
| 3 | Base de lugares de JF e busca | Buscar "poleiro" e ver as duas unidades, sem duplicatas | M | 2 | a fazer |
| 4 | Registro rápido e mapa | Registrar uma visita e ver o ponto no mapa | G | 3 | a fazer |
| 5 | Lugares novos e sinalizações | Criar um lugar e sinalizar "fechou" | M | 4 | a fazer |
| 6 | Cidades já visitadas e abas do mapa | Marcar Paris e ver a França pintada | M | 4 | a fazer |
| 7 | Fotos | Foto salva sem metadados e "completar depois" | M | 4 | a fazer |
| 8 | Perfil, estatísticas e privacidade | O próprio perfil e o perfil visto por outra pessoa | G | 6, 7 | a fazer |
| 9 | Seguir e feed | Seguir alguém e ver só o que é permitido | M | 8 | a fazer |
| 10 | Atualização da base e preparação do beta | O app no ar, instalado no celular | G | 9 | a fazer |

A ordem segue a seção 15 do documento ("Ordem sugerida das fatias"), com três acréscimos: o esqueleto (Fatia 0), a direção visual (Fatia 1) e a preparação do beta (Fatia 10).

## Definição de pronto (vale para toda fatia)

- [ ] Critérios de aceite cobertos por testes automatizados. Quando não der para automatizar, a verificação manual fica registrada no PR.
- [ ] Em `web/`: `npm run lint`, `npm run typecheck`, `npm test` e `npm run build` passando.
- [ ] Se mexeu no banco: migração nova, `npx supabase db reset` e `npx supabase test db` passando.
- [ ] Telas conferidas em 390 × 844 e 1280 × 800, com prints no PR.
- [ ] Revisor de privacidade rodado, se a fatia mexe em dados de usuário.
- [ ] Roadmap, `CLAUDE.md` (se os comandos mudaram) e ADRs atualizados.
- [ ] PR aberto, CI verde e merge na `main`.

---

## Fase 1: fundação e MVP

### Fatia 0: Esqueleto no localhost

**Status:** a fazer · **Tamanho:** M

**Objetivo:** ter o app rodando no localhost com a "casca" do Lugora (navegação, telas com dados de exemplo e o mapa), sem banco de dados. Rápido de construir, para você começar a reagir ao produto.

**Você vai ver:** em http://localhost:3000, uma barra inferior com Mapa, Feed, Registrar (botão central), Quero ir e Perfil. Na aba Mapa, Juiz de Fora com alguns pontos fictícios. Na aba Registrar, o formulário de registro rápido (ainda sem salvar). Na aba Perfil, estatísticas de exemplo. Tudo funcionando no celular, pela rede Wi-Fi.

**Ler antes:** [1. O essencial](visao/01-o-essencial.md) · [5. Princípios](visao/05-principios-do-produto.md) · [10. Arquitetura](visao/10-arquitetura-e-stack.md) · [13. Acessibilidade e design](visao/13-acessibilidade-e-design.md) · ADRs [0001](decisoes/0001-stack.md), [0002](decisoes/0002-estrutura-do-repositorio.md) e [0003](decisoes/0003-idioma-do-codigo.md)

**Tarefas:**

- [ ] Aceitar (ou ajustar) os ADRs 0001 a 0003.
- [ ] Criar `web/` com `create-next-app`: TypeScript, Tailwind, App Router, ESLint, pasta `src/`, npm, sem iniciar outro repositório git.
- [ ] Scripts no `package.json`: `dev`, `build`, `lint`, `typecheck` (`tsc --noEmit`) e `test` (Vitest).
- [ ] Layout mobile-first com a barra inferior e as rotas `/mapa`, `/feed`, `/registrar`, `/quero-ir` e `/perfil`.
- [ ] Dados fictícios num único arquivo (`web/src/lib/mock-data.ts`), para serem trocados pelo banco depois.
- [ ] Mapa com MapLibre GL JS e OpenFreeMap, centrado em Juiz de Fora, com atribuição visível e pontos fictícios.
- [ ] Textos da interface em `web/src/content/pt-BR.ts`.
- [ ] Manifesto PWA (nome Lugora, ícone provisório), para o app poder ser instalado no celular.
- [ ] Um teste Vitest de exemplo: formatar a nota 4.5 como "4,5".
- [ ] CI verde no GitHub (`.github/workflows/ci.yml`, job "web").
- [ ] Ver no celular: `npm run dev` e abrir o endereço "Network" que o Next mostra, com o celular na mesma rede Wi-Fi. Se o Next avisar sobre origem cruzada, configurar `allowedDevOrigins`.
- [ ] (Recomendado) Conectar o repositório à Vercel com Root Directory = `web`. Cada PR ganha um link de preview em HTTPS.

**Aceite:**

- Dado o app rodando, quando abro `/` no celular, então caio no mapa de JF, e a barra inferior troca de tela sem recarregar a página.
- Dado o mapa, quando dou zoom, então a atribuição do OpenStreetMap continua visível.
- Dado o PR aberto, então a CI roda lint, tipos, testes e build, e passa.

**Fora do escopo:** banco, login, salvar dados, identidade visual final.

**Você vai aprender:** como o App Router transforma pastas em rotas; Server × Client Components; Tailwind; manifesto PWA; mapas com *vector tiles*; o que a CI faz em cada PR.

---

### Fatia 1: Direção visual

**Status:** a fazer · **Tamanho:** P

**Objetivo:** escolher a identidade visual antes de construir as telas de verdade, comparando opções reais no navegador em vez de imaginar.

**Você vai ver:** em http://localhost:3000/estilos, três direções visuais lado a lado. Cada uma mostra paleta, tipografia, botões, o card de uma visita, a barra de navegação e o mapa com as quatro faixas de cor da seção 7.4. Você escolhe uma, ou pede uma mistura.

**Ler antes:** [13. Acessibilidade e design](visao/13-acessibilidade-e-design.md) · [7.4 Mapa](visao/07-regras/04-mapa.md) · `docs/design/referencias/`

**Tarefas:**

- [ ] Colocar em `docs/design/referencias/` de 3 a 6 prints de apps que você gosta, cada um com uma linha dizendo o quê (o Claude Code lê imagens).
- [ ] Instalar o plugin `frontend-design` (ver o guia de início).
- [ ] Gerar as três direções na rota `/estilos`.
- [ ] Escolher uma e transformá-la em tokens (cores claro/escuro, tipografia, espaçamento, raios) no tema do Tailwind.
- [ ] Paleta sequencial do mapa em 4 níveis, com variação de luminosidade e segura para daltônicos.
- [ ] Registrar a escolha em `docs/design/identidade.md` e aplicar os tokens nas telas da Fatia 0.
- [ ] Remover a rota `/estilos`.

**Aceite:**

- Contraste de texto de pelo menos 4,5:1 nos dois temas.
- Os 4 níveis do mapa continuam distinguíveis com o simulador de daltonismo do Chrome (DevTools › Rendering › Emulate vision deficiencies).
- Nenhuma cor fixa fora dos tokens.

**Fora do escopo:** logotipo final (pode ser provisório).

**Você vai aprender:** design tokens; tema claro e escuro; contraste (WCAG); paletas sequenciais.

---

### Fatia 2: Banco local e contas

**Status:** a fazer · **Tamanho:** G

**Objetivo:** Supabase rodando no seu computador, com as primeiras tabelas, login e cadastro, e as regras de acesso testadas desde o início.

**Você vai ver:** o botão "Entrar". Você entra com e-mail (o Supabase local captura o e-mail de teste numa caixa própria), passa pelo cadastro e vê o perfil com o seu @ e a sua cidade. No Studio (http://127.0.0.1:54323), as tabelas e as políticas de acesso.

**Ler antes:** [8. Modelo de dados](visao/08-modelo-de-dados.md) · [9. Privacidade](visao/09-privacidade-seguranca-e-lgpd.md) · [7.3 Cidade e país](visao/07-regras/03-cidade-e-pais.md) · [Glossário](glossario.md)

**Pré-requisito:** Docker Desktop instalado e rodando (ver o guia de início). Se o computador não aguentar o Docker, use um projeto Supabase de desenvolvimento na nuvem e registre a escolha num ADR.

**Tarefas:**

- [ ] `npx supabase init` na raiz e `npx supabase start`.
- [ ] Migrações de `profiles`, `profiles_private`, `consents`, `countries`, `cities` e `app_parameters`, com PostGIS. As outras tabelas entram nas fatias que precisam delas.
- [ ] A cidade de residência e as configurações ficam em `profiles_private`, que só o dono lê. Motivo: o RLS protege linhas, não colunas; se `home_city_id` ficasse em `profiles`, quem pode ver o perfil veria a cidade.
- [ ] Pipeline de carga dos limites do Overture (tema divisions): todos os países e as cidades do Brasil, em `pipelines/overture/`.
- [ ] Login por e-mail. Login com Google é opcional aqui: ele exige criar credenciais no Google Cloud Console, então, se travar, deixe para a Fatia 10.
- [ ] Cadastro: confirmação de 18+, consentimentos por finalidade (seção 9.1), nome, @ e cidade onde mora (privada).
- [ ] RLS em todas as tabelas, com testes pgTAP: o usuário lê e edita o próprio perfil e não lê a cidade de residência de outra pessoa.
- [ ] `supabase/seed.sql` com 3 usuários fictícios.
- [ ] CI: job "database" rodando `supabase test db`.
- [ ] (Recomendado) Criar um projeto Supabase de homologação na nuvem, aplicar as migrações e ligá-lo ao preview da Vercel. Ele passa a ser obrigatório na Fatia 4, para testar o GPS no celular.

**Aceite:**

- Dado o usuário A logado, quando ele consulta a API pedindo o perfil de B, então `home_city_id` não vem (teste pgTAP).
- Dado o cadastro sem a confirmação de 18+, então não é possível concluir.
- Dado `npx supabase db reset`, então o banco é recriado do zero com o seed e todos os testes passam.

**Fora do escopo:** excluir e exportar conta (Fatia 8), seguir (Fatia 9).

**Você vai aprender:** migrações; RLS na prática; pgTAP; como funciona o login (sessão, cookies, OAuth); variáveis de ambiente; Docker.

---

### Fatia 3: Base de lugares de JF e busca

**Status:** a fazer · **Tamanho:** M

**Objetivo:** carregar os 19.459 lugares de Juiz de Fora com as regras D1 a D4 e ter uma busca boa.

**Você vai ver:** na tela Registrar, digitando "poleiro", aparecem as **duas** unidades do Poleiro do Galo (a 2,5 km uma da outra), cada uma com endereço e distância. Digitando "viva gula", aparece **um** resultado, porque os dois registros no mesmo ponto foram mesclados. Condomínios não aparecem como lugares para visitar.

**Ler antes:** [7.2 Base de lugares (D1 a D5)](visao/07-regras/02-base-de-lugares-importacao-e-deduplicacao.md) · [10. Arquitetura (pipeline)](visao/10-arquitetura-e-stack.md) · [ADR 0004](decisoes/0004-base-de-lugares-overture.md) · `pipelines/overture/README.md`

**Tarefas:**

- [ ] Migrações de `places`, `category_map` e `overture_imports`.
- [ ] Popular `category_map` com os grupos visitáveis (D3) e as categorias sensíveis (D5).
- [ ] `pipelines/overture/importar_lugares.py`: lê o snapshot, aplica a limpeza (D3), deduplica (D4), importa tudo sem corte de confiança (D1), sem e-mails nem telefones, e registra a execução em `overture_imports`.
- [ ] Testes `pytest` da limpeza e da deduplicação, com os casos reais do diagnóstico.
- [ ] Função SQL de busca: semelhança de nome (extensão `pg_trgm`), distância, visitas no Lugora e confiança, nessa ordem (D1).
- [ ] Tela de busca dentro de Registrar.

**Aceite:**

- Dada a importação, quando rodo duas vezes a mesma versão, então nada duplica (idempotência).
- Dado o texto "poleiro", então aparecem 2 resultados, com endereços diferentes (filiais não são mescladas).
- Dado o texto "viva gula", então aparece 1 resultado (os 2 registros no mesmo ponto foram mesclados pela D4).
- Dado "Santiago Lanches" (confiança 0,29), então ele aparece na busca pelo nome.
- Dado um lugar com nome "Condomínio …", então ele não aparece como visitável.

**Fora do escopo:** criar lugar novo (Fatia 5), atualização mensal (Fatia 10).

**Você vai aprender:** ETL de verdade; busca por similaridade (trigramas); índices geográficos; idempotência.

---

### Fatia 4: Registro rápido de visita e mapa

**Status:** a fazer · **Tamanho:** G

**Objetivo:** o coração do produto. Registrar uma visita em menos de 20 segundos e vê-la no mapa.

**Você vai ver:** você registra o Santiago Lanches com data, nota 4,5 e a ocasião "Com amigos", e o ponto aparece no mapa, na aba Minha cidade. Logado como outro usuário de teste, a visita só aparece depois do atraso de publicação.

**Ler antes:** [7.1 Visita](visao/07-regras/01-visita-registro.md) · [7.4 Mapa](visao/07-regras/04-mapa.md) · [7.5 Publicação](visao/07-regras/05-publicacao-visibilidade-e-atraso.md) · [7.8 Ocasiões](visao/07-regras/08-ocasioes-e-etiquetas.md) · [9. Privacidade (9.3 a 9.5)](visao/09-privacidade-seguranca-e-lgpd.md)

**Tarefas:**

- [ ] Migrações de `visits`, `tags`, `visit_tags` e `trips` (o básico), com RLS.
- [ ] Fluxo de registro rápido: lugar, data (hoje por padrão), nota de 0,5 a 5 e até 3 ocasiões.
- [ ] `is_resident` gravado no momento da visita.
- [ ] Regras de publicação (7.5): Minha cidade 24 h depois; viagem ao encerrar; "publicar agora" com aviso; lugar sensível nasce "só eu".
- [ ] "Lugares perto de mim" pelo GPS, testado no celular pelo preview em HTTPS (projeto de homologação da Fatia 2).
- [ ] Mapa com os pontos visitados, as abas Viagens e Minha cidade, e as faixas de cor por lugares distintos (7.4).
- [ ] Primeiro teste de fluxo com Playwright: registrar uma visita do começo ao fim.

**Aceite:** testes de aceitação 1, 2, 3, 4 e 5 da seção 9.5, mais:

- Dado um registro, quando cronometro do toque em Registrar até salvar, então leva menos de 20 segundos.
- Dadas duas visitas ao mesmo lugar, então o mapa conta 1 lugar distinto.

**Fora do escopo:** fotos (Fatia 7), criar lugar (Fatia 5), feed (Fatia 9).

**Você vai aprender:** formulários com validação; regras de negócio testáveis; consultas geográficas; testes de ponta a ponta.

---

### Fatia 5: Lugares novos e sinalizações

**Status:** a fazer · **Tamanho:** M

**Objetivo:** quando o lugar não existe na base, criar sem duplicar; quando fechou, o próprio usuário avisar.

**Você vai ver:** você cria "Bar Teste" a 30 m de um lugar com nome parecido, e o app pergunta "Você quis dizer…?". Como outro usuário, você vê o selo "não verificado". Com dois usuários sinalizando "fechou", o lugar some da busca e continua no histórico de quem visitou.

**Ler antes:** [7.2 Base de lugares (D2, D3, D4, D6)](visao/07-regras/02-base-de-lugares-importacao-e-deduplicacao.md)

**Tarefas:**

- [ ] Criar lugar dentro do registro, com checagem de duplicata num raio de 150 m (D4) e limite de 5 por dia.
- [ ] Verificação (D6): GPS a até 100 m, segunda visita de outra pessoa ou usuário de confiança.
- [ ] Migração de `place_flags`. Sinalizações: fechou de vez, fechou temporariamente, mudou de endereço, categoria errada, duplicado.
- [ ] Regras de fechamento (D2) e de correção de categoria (D3). Só sinaliza quem tem pelo menos 3 visitas.
- [ ] Testes de cada regra.

**Aceite:**

- Dado um lugar com 2 sinalizações "fechou de vez" de usuários diferentes, então ele sai da busca e mantém o selo "fechado" no histórico.
- Dada uma visita nova depois de uma sinalização pendente, então a pendência é cancelada.
- Dado um usuário com menos de 3 visitas, então ele não consegue sinalizar.

**Fora do escopo:** painel de moderação.

**Você vai aprender:** *entity resolution* na prática; regras de confiança; máquinas de estado simples (pendente → ativo → fechado).

---

### Fatia 6: Cidades já visitadas e abas do mapa

**Status:** a fazer · **Tamanho:** M

**Objetivo:** o mapa já pintado no primeiro minuto (seção 7.4, camada 1) e o mapa de países.

**Você vai ver:** no primeiro acesso, você marca as cidades onde já esteve, sem precisar registrar lugar. Ao marcar Paris e Lisboa, França e Portugal aparecem pintados, e a cor esquenta conforme os lugares distintos.

**Ler antes:** [7.3 Cidade e país](visao/07-regras/03-cidade-e-pais.md) · [7.4 Mapa](visao/07-regras/04-mapa.md)

**Tarefas:**

- [ ] Decidir, num ADR, a fonte da lista mundial de cidades para o "já estive". Por exemplo: localidades do Overture (tema divisions, como pontos) filtradas por relevância. O mapa usa cidades como pontos no v1 (7.4); polígonos só onde forem necessários.
- [ ] Migração de `marked_cities`. Tela "Já estive" no cadastro e no perfil.
- [ ] Mapa de países (polígonos) com camada 1 (amplitude) e camada 2 (profundidade).
- [ ] Estatísticas básicas: países, cidades e lugares distintos.

**Aceite:**

- Dado um usuário novo, quando ele marca 3 cidades no cadastro, então o mapa já aparece pintado no primeiro acesso.
- Dadas visitas repetidas ao mesmo lugar, então a profundidade não aumenta.

**Fora do escopo:** hexágonos H3 e imagem para story (Fase 2).

**Você vai aprender:** dados geográficos em camadas; polígonos × pontos; escolher dados pelo custo e pela licença.

---

### Fatia 7: Fotos

**Status:** a fazer · **Tamanho:** M

**Objetivo:** fotos nas visitas, com privacidade garantida e sem travar o registro rápido.

**Você vai ver:** você sobe uma foto com GPS nos metadados, e o app sugere a data e o lugar a partir dela. A foto salva não tem metadado nenhum. A tela "Completar depois" lista as visitas sem foto.

**Ler antes:** [7.6 Fotos](visao/07-regras/06-fotos.md) · [7.7 Galeria (só o consentimento)](visao/07-regras/07-galeria-do-lugar-fase-2.md) · [9. Privacidade](visao/09-privacidade-seguranca-e-lgpd.md)

**Tarefas:**

- [ ] Bucket no Supabase Storage, com política de acesso por pasta do usuário.
- [ ] Rota no servidor do app que lê os metadados (só para sugerir data e lugar), recodifica em WebP sem metadados, gera a miniatura e envia com a sessão do usuário. Sem `service_role`.
- [ ] Até 3 fotos por visita, até 10 MB cada. Texto alternativo opcional.
- [ ] Campo `show_in_gallery` (consentimento por foto), já pensando na galeria da Fase 2.
- [ ] Tela "Completar depois".

**Aceite:** teste de aceitação 8 da seção 9.5 (arquivo salvo sem metadados), automatizado com uma foto de exemplo que tem GPS.

**Fora do escopo:** galeria do lugar (Fase 2), vídeo (Fase 3).

**Você vai aprender:** processamento de imagem no servidor; metadados EXIF; armazenamento com regras de acesso.

---

### Fatia 8: Perfil, estatísticas e privacidade

**Status:** a fazer · **Tamanho:** G

**Objetivo:** o perfil como vitrine pessoal, sem vazar o que a pessoa escondeu, e os direitos da LGPD funcionando.

**Você vai ver:** o seu perfil e, ao lado, o mesmo perfil visto por outro usuário de teste: mapa em resolução grossa, sem o rótulo da sua cidade, e números calculados só com o que ele pode ver. Em Configurações, exportar os dados e excluir a conta de verdade.

**Ler antes:** [7.12 Perfil de viajante](visao/07-regras/12-perfil-de-viajante.md) · [9. Privacidade (9.1 e 9.3)](visao/09-privacidade-seguranca-e-lgpd.md) · [7.4 Mapa](visao/07-regras/04-mapa.md)

**Tarefas:**

- [ ] Perfil próprio × perfil público (9.3): mapa público grosso, `show_home_city` desligado por padrão, eixo Onde depois de 10 visitas.
- [ ] Configurações: visibilidade padrão, mostrar cidade, consentimentos.
- [ ] Exportar meus dados (JSON) e excluir conta, incluindo as fotos no armazenamento.
- [ ] Funções de agregados que aplicam a regra "só o que quem vê pode ver", fora do schema `public` (ADR 0005).

**Aceite:** testes de aceitação 7 e 9 da seção 9.5, mais:

- Dada a exclusão de conta, então não sobra nenhuma linha nem arquivo do usuário.

**Fora do escopo:** eixo Como (Fase 3), sequência semanal (Fase 2).

**Você vai aprender:** privacidade por desenho; agregação segura; como atender os direitos do titular na prática.

---

### Fatia 9: Seguir e feed

**Status:** a fazer · **Tamanho:** M

**Objetivo:** o lado social mínimo. Seguir pessoas e ver as visitas delas, respeitando visibilidade e atraso.

**Você vai ver:** o usuário de teste A segue B e vê no feed só as visitas que B deixou ver, na ordem certa. Perfil privado pede aprovação. Bloquear e denunciar funcionam.

**Ler antes:** [7.13 Seguir e feed](visao/07-regras/13-seguir-e-feed.md) · [7.5 Publicação](visao/07-regras/05-publicacao-visibilidade-e-atraso.md) · [9. Privacidade](visao/09-privacidade-seguranca-e-lgpd.md)

**Tarefas:**

- [ ] Migrações de `follows` e `content_reports`, com RLS.
- [ ] Seguir é unilateral; perfil privado exige aprovação; bloquear e denunciar.
- [ ] Feed cronológico (view com `security_invoker`).

**Aceite:** testes de aceitação 1 e 3 da seção 9.5 aplicados ao feed, mais:

- Dado que A bloqueou B, então B não vê A em lugar nenhum.

**Fora do escopo:** curtidas, comentários, notificações (Fase 2).

**Você vai aprender:** modelagem de grafo social simples; paginação; views seguras.

---

### Fatia 10: Atualização da base e preparação do beta

**Status:** a fazer · **Tamanho:** G

**Objetivo:** deixar o app pronto para as primeiras pessoas de verdade.

**Você vai ver:** o Lugora num endereço público, instalado no seu celular, com os dados da Fase 0 importados (com autorização) e a página Sobre com a atribuição dos dados.

**Ler antes:** [10. Arquitetura (atualização incremental e atribuição)](visao/10-arquitetura-e-stack.md) · [12. Métricas](visao/12-metricas-do-produto.md) · [11. Fase 0](visao/11-fase-0-plano-do-teste-concierge.md) · [9.1 LGPD](visao/09-privacidade-seguranca-e-lgpd.md)

**Tarefas:**

- [ ] Atualização mensal incremental pelo changelog do Overture: idempotente, registrada em `overture_imports`, com `removed` virando sinalização (D2).
- [ ] Projeto Supabase de produção, migrações aplicadas pela CLI, e a Vercel apontando para ele.
- [ ] Login com Google em produção, se ainda não estiver feito.
- [ ] Termos de uso e política de privacidade em linguagem simples (revisar com um advogado antes de abrir ao público).
- [ ] Página Sobre com a atribuição (seção 10).
- [ ] Tabela `events` gravando os eventos da seção 12.
- [ ] Importar os registros da Fase 0 e medir quantos lugares digitados pelas pessoas a base encontrou (cobertura real).

**Aceite:** todos os 9 testes de aceitação da seção 9.5 passando contra o projeto de homologação, e o checklist do portão do beta abaixo.

**Você vai aprender:** deploy; separação de ambientes (local, homologação, produção); captura de mudanças (CDC); métricas de produto.

---

## Portão do beta

O beta fechado (20 a 30 pessoas) só abre quando:

- [ ] A Fase 0 terminou e foi analisada contra os critérios da seção 11.6.
- [ ] As decisões da Fase 0 foram aplicadas: lista de ocasiões revisada e ideias de `ideias-para-depois.md` promovidas ou arquivadas.
- [ ] As Fatias 0 a 10 estão concluídas.
- [ ] Os 9 testes de aceitação da seção 9.5 passam em homologação.
- [ ] Os termos, a política de privacidade e a atribuição estão publicados.
- [ ] Os eventos de métricas estão sendo gravados.

## Fases 2 e 3 (detalhar só depois do portão)

**Fase 2, convites e hábito** (seção 6 do documento):

- listas públicas e de curadoria;
- viagem em grupo;
- mapa em hexágonos H3 e imagem para story;
- galeria do lugar (7.7);
- convites rastreados (medir o K);
- sequência semanal (7.9);
- resumo semanal por e-mail;
- camada analítica com dbt e dashboard;
- modo demonstração para recrutadores.

**Fase 3, descoberta por cidade:**

- busca por ocasião;
- índice morador × visitante (7.11);
- nota de quem você segue;
- eixo Como do perfil;
- retrospectiva anual.

---

## Trilha A: Fase 0 (em paralelo, quase sem código)

Plano completo em [11. Fase 0](visao/11-fase-0-plano-do-teste-concierge.md).

- [ ] Definir a data de início.
- [ ] Recrutar 26 pessoas nos 5 grupos (11.2), com pessoas que se conhecem dentro de cada grupo.
- [ ] Formulários de cadastro e de registro, mais a autorização de uso dos dados (11.3).
- [ ] Script Python do mapa semanal (folium), em `pipelines/fase0/`, com os dados fora do git.
- [ ] Entrevistas iniciais (roteiro 11.5).
- [ ] 4 semanas de ritual semanal, sem cobrança individual (11.4).
- [ ] Entrevistas finais e análise contra os critérios de sucesso (11.6).
- [ ] Teste de cobertura real: quantos lugares registrados pelas pessoas existem na base.

## Tarefas paralelas de portfólio

- [ ] Publicar o diagnóstico do Overture: `pipelines/overture/README.md` mais um post contando os achados.
- [ ] Reservar o nome: INPI (classes 9 e 42), domínio e @ nas redes.
- [ ] Revisar o `CLAUDE.md` a cada 3 fatias e cortar o que não faz diferença.
