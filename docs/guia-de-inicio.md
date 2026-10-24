# Guia de início

Do zero ao primeiro localhost, e o ciclo de trabalho de cada fatia com o Claude Code. Escrito para Windows.

## 1. Instalar os programas (uma vez)

Abra o PowerShell e instale:

| Programa | Para quê | Como instalar |
| --- | --- | --- |
| Git for Windows | Versionar o código. Também dá ao Claude Code o terminal Bash | `winget install --id Git.Git -e` |
| Node.js LTS | Rodar o app (precisa da versão 20.9 ou mais nova) | `winget install --id OpenJS.NodeJS.LTS -e` |
| VS Code | Ler e revisar o código | `winget install --id Microsoft.VisualStudioCode -e` |
| GitHub CLI (`gh`) | Criar repositório e PRs pelo terminal | `winget install --id GitHub.cli -e` |
| Claude Code | O agente que vai programar com você | `irm https://claude.ai/install.ps1 \| iex` |
| Python 3.10+ | Pipelines de dados | já instalado |
| Docker Desktop | Banco local (só a partir da Fatia 2) | `winget install --id Docker.DockerDesktop -e` |

Feche e abra o terminal, e confira: `git --version`, `node --version`, `gh --version` e `claude --version`.

O Claude Code exige um plano pago (Pro, Max, Team, Enterprise ou Console). O instalador nativo atualiza sozinho.

**Configurações do Git (uma vez):**

```powershell
git config --global user.name "Seu Nome"
git config --global user.email "seu-email-do-github"
git config --global init.defaultBranch main
git config --global core.longpaths true
gh auth login
```

O `core.longpaths` evita erros com caminhos longos dentro de `node_modules`.

**Se o PowerShell bloquear o `npm`** com a mensagem "a execução de scripts foi desabilitada neste sistema":

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

**Extensões úteis no VS Code:** ESLint, Prettier, Tailwind CSS IntelliSense, Python e a extensão do Claude Code.

## 2. Criar o repositório

Coloque o projeto **fora do OneDrive**, por exemplo em `C:\dev\lugora`. O OneDrive tenta sincronizar os milhares de arquivos de `node_modules`, o que deixa tudo lento e trava arquivos.

Descompacte o kit nessa pasta e rode:

```powershell
cd C:\dev\lugora
git init
git add .
git commit -m "Estrutura inicial do projeto"
gh repo create lugora --public --source . --push
```

**Público ou privado?** Recomendo público desde o início: o histórico de commits e PRs também é portfólio. O `.gitignore` já bloqueia os arquivos `.env`, e em repositórios públicos o GitHub barra por padrão o envio de chaves conhecidas (*push protection*).

**Proteja a `main` (recomendado):** no GitHub, abra Settings › Rules › Rulesets e crie uma regra para a `main` que exige pull request e a CI passando. Mesmo trabalhando sozinho, isso força o ciclo branch → PR → CI → merge.

**O que já vem pronto no `.github/`:**

- **CI:** lint, tipos, testes e build do app; testes do banco; checagem dos pipelines. Cada parte só roda quando a pasta dela existe.
- **Dependabot:** um PR por mês com as atualizações de dependências, agrupadas.
- **Modelos de PR e de issue** ("Fatia" e "Bug").

**Opcional:** um quadro no GitHub Projects com uma issue por fatia, usando o modelo "Fatia". O progresso fica visível para quem visita o perfil.

## 3. Preparar o Claude Code no projeto

```powershell
cd C:\dev\lugora
claude
```

Na primeira vez, faça o login pelo navegador. Depois, dentro do Claude Code:

1. `/context`: confira se o `CLAUDE.md` foi carregado.
2. **Plugins oficiais da Anthropic:**
   - `/plugin install frontend-design@claude-plugins-official`: interfaces com identidade própria, em vez de visual genérico. Usado na Fatia 1.
   - `/plugin install commit-commands@claude-plugins-official`: atalhos de commit, push e PR (opcional).
   - Inteligência de código para TypeScript: rode `/plugin`, abra a aba Discover e busque "typescript". Ajuda o Claude a achar erros de tipo logo depois de editar.
3. **MCP do Playwright** (o Claude abre o navegador, navega no seu localhost e tira prints). No PowerShell, fora do Claude Code:

   ```powershell
   claude mcp add playwright npx @playwright/mcp@latest
   ```

   Confira com `/mcp` na próxima sessão.
4. **MCP do Supabase local** (a partir da Fatia 2, com o banco rodando). Deixa o Claude consultar tabelas e políticas:

   ```powershell
   claude mcp add --transport http supabase-local http://localhost:54321/mcp
   ```

   Use só com o banco local. Num projeto na nuvem, use o modo somente leitura.
5. **GitHub App do Claude** (opcional, depois da Fatia 2): `/install-github-app` permite chamar `@claude` em issues e PRs. Consome o seu plano ou créditos de API, além de minutos do GitHub Actions.

**Skills deste projeto** (pasta `.claude/skills/`):

| Comando | Para quê |
| --- | --- |
| `/fatia N` | Começar ou retomar a fatia N do roadmap |
| `/fechar-fatia` | Conferir a definição de pronto, revisar privacidade, atualizar a documentação e abrir o PR |
| `/ideia texto` | Registrar uma ideia em `docs/ideias-para-depois.md` sem implementar |
| `/adr título` | Registrar uma decisão técnica |
| `/explicar arquivo` ou `/explicar diff` | Entender o que foi feito, para aprender |

**Comandos nativos úteis:**

| Comando | Para quê |
| --- | --- |
| `/code-review` | Revisão do diff atual por um subagente |
| `/verify` | Sobe o app e confere se a mudança faz o que deveria |
| `/clear` | Limpa o contexto entre tarefas |
| `/compact` | Resume a conversa quando ela fica longa |
| `/rewind` (ou Esc duas vezes) | Volta a conversa e o código para um ponto anterior |
| `/rename` | Dá nome à sessão |
| `/memory` | Mostra o `CLAUDE.md` e o que o Claude anotou sozinho sobre o projeto |

O subagente `revisor-privacidade` (`.claude/agents/`) é chamado pelo `/fechar-fatia`. Você também pode pedir direto: "use o revisor-privacidade nesta branch".

## 4. O ciclo de cada fatia

1. `git switch main` e `git pull`.
2. Abra o `claude` e dê nome à sessão, por exemplo `/rename fatia-00-esqueleto`.
3. Aperte Shift+Tab até aparecer "plan mode on" e rode `/fatia 0`. Leia o plano. Pergunte "por quê?" sempre que algo não estiver claro. Aprove.
4. Enquanto ele trabalha, deixe o app aberto em outro terminal (`cd web` e `npm run dev`, depois http://localhost:3000). Reaja ao que vê: cole prints no Claude Code ("no celular isso ficou apertado").
5. Antes de aceitar algo que não entendeu, rode `/explicar diff`.
6. `/fechar-fatia` abre o PR. Espere a CI ficar verde, teste o preview no celular e faça o merge.
7. `/clear` antes da próxima fatia.

**Regras de bolso:**

- Esc interrompe o Claude na hora, sem perder o contexto.
- Corrigiu a mesma coisa duas vezes e não resolveu? Rode `/clear` e escreva um pedido melhor, com o que você aprendeu.
- Commits pequenos são pontos de retorno: o git desfaz o que o `/rewind` não alcança.
- Nunca cole senha, chave ou conteúdo de `.env` no chat.

## 5. Ideias novas

Teve uma ideia no meio de uma fatia? Rode `/ideia descrição` e volte ao trabalho. A ideia fica registrada com hipótese e forma de validar, e só entra no roadmap quando passar pela regra de promoção de `docs/ideias-para-depois.md`. É isso que protege o projeto do maior risco: não terminar.

## 6. Primeira sessão e prompts de cada fatia

Os prompts prontos para colar estão em [prompts.md](prompts.md): a sessão 0 (antes de codar), o ciclo de toda fatia e os blocos de cada fatia ("Abrir", "Durante", "Aprender", "Fechar").

## 7. Problemas comuns no Windows

| Sintoma | Causa provável | Solução |
| --- | --- | --- |
| "a execução de scripts foi desabilitada" ao rodar `npm` | Política do PowerShell | `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` |
| `claude` não é reconhecido | O terminal não leu o PATH novo | Feche e abra o terminal. Se continuar, rode `claude doctor` |
| `npm install` lento, ou erros EPERM/EBUSY | Pasta dentro do OneDrive, ou antivírus | Mover o projeto para `C:\dev` |
| O celular não abre o app | Firewall do Windows ou redes diferentes | Permitir o Node.js na rede privada; celular e PC na mesma Wi-Fi |
| GPS não funciona no celular | Em `http://`, o navegador bloqueia a localização | Usar o preview em HTTPS da Vercel |
| `npx supabase start` falha | Docker Desktop fechado ou WSL 2 desativado | Abrir o Docker Desktop e esperar o status "running" |
| O Claude Code não roda comandos Bash | Git for Windows não instalado | Instalar o Git (sem ele, o Claude usa o PowerShell) |

## 8. Custos

- **Claude Code:** plano pago da Anthropic (Pro, Max, Team, Enterprise ou Console).
- **GitHub, Vercel (plano Hobby, uso pessoal), Supabase (plano gratuito), OpenFreeMap e Overture:** gratuitos para este projeto. O Supabase gratuito pausa projetos depois de 7 dias sem uso.
- **GitHub App do Claude:** usa o seu plano ou créditos de API, mais minutos do GitHub Actions.
- **Domínio:** opcional.

## 9. O que aprender em paralelo (pouco por vez)

- **Git e GitHub:** branch, commit, PR e merge. [Pro Git em português](https://git-scm.com/book/pt-br/v2)
- **React:** componentes, props e estado. [react.dev/learn](https://react.dev/learn)
- **Next.js:** rotas e Server Components. [nextjs.org/learn](https://nextjs.org/learn)
- **RLS no Supabase:** a sua força em SQL aplicada à segurança. [Documentação de Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- **Revisar código:** use `/explicar diff` em toda fatia e tente responder ao exercício do final antes de seguir.
