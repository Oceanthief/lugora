# Prompts por fatia

O que colar no Claude Code em cada momento do projeto. Complementa o [roadmap](roadmap.md): o roadmap diz **o que** construir; este arquivo diz **o que pedir**.

## Como usar

- **Um bloco = uma mensagem.** Espere a resposta antes de mandar o próximo.
- **Modo de plano:** os blocos "Abrir" vão em modo de plano. Aperte Shift+Tab até aparecer "plan mode on".
- **Checkpoints:** os blocos "Durante" servem para quando você chegar àquele ponto. Repita quantas vezes precisar.
- **Colchetes:** troque o que estiver `[assim]`.
- **Se o `/fatia N` não aceitar texto junto:** mande `/fatia N` sozinho e cole as instruções extras na mensagem seguinte, antes de aprovar o plano.
- **Prints:** cole ou arraste a imagem direto no prompt.
- **No GitHub:** cada bloco tem um botão de copiar no canto.

---

## Sessão 0: antes da Fatia 0 (sem código)

**1. O Claude entendeu o projeto?**

```text
Leia o CLAUDE.md, o docs/roadmap.md e o docs/visao/README.md. Em até 10 linhas, me diga o que é o Lugora, o que a Fatia 0 entrega e o que você ainda não entendeu. Não escreva código.
```

**2. O ambiente está pronto?**

```text
Confira meu ambiente sem instalar nada: versões de node, npm, git e gh; se o gh está autenticado; e se esta pasta está fora do OneDrive. Me diga o que falta, com o comando para resolver.
```

**3. As decisões de base fazem sentido?**

```text
Leia os ADRs 0001, 0002 e 0003 em docs/decisoes/. Para cada um: a decisão em 2 linhas, o principal risco e o que eu ganharia ou perderia com a alternativa mais forte. Não mude nada.
```

---

## O ciclo de toda fatia

| Momento | O que fazer |
| --- | --- |
| 1. Começo | No terminal: `git switch main` e `git pull`. No Claude Code: `/rename fatia-NN-nome` |
| 2. Abrir | Modo de plano + o bloco "Abrir" da fatia |
| 3. Aprovar o plano | Bloco "Aprovar" abaixo |
| 4. Conferir | Blocos "Durante" da fatia + bloco "Feedback com print" |
| 5. Aprender | Bloco "Aprender" da fatia |
| 6. Fechar | `/fechar-fatia` |
| 7. Depois do merge | `/clear` |

**Aprovar** (depois de ler o plano e tirar as dúvidas):

```text
Plano aprovado. Faça só a primeira entrega e pare para eu conferir no localhost. Me diga o endereço e o que devo ver.
```

**Seguir:**

```text
Conferi. Pode seguir para a próxima entrega.
```

**Feedback com print:**

```text
[cole o print] Na tela [nome], [o que incomodou]. Ajuste só isso, sem mexer no resto, e me mostre o antes e o depois.
```

---

## Fatia 0: Esqueleto no localhost

**Antes:** só siga se você concorda com os ADRs 0001 a 0003 (sessão 0). Se mudou algo, diga nas instruções.

**Abrir** (modo de plano):

```text
/fatia 0 Instruções extras:
- Primeiro passo: mude o status dos ADRs 0001, 0002 e 0003 para "aceita", nos arquivos e no índice.
- Crie o app com: npx create-next-app@latest web --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --disable-git --yes
- Navegação inferior com 5 itens: Mapa, Feed, Registrar (botão central em destaque), Quero ir e Perfil. A página inicial abre /mapa.
- Mapa com MapLibre GL JS e o estilo do OpenFreeMap, centrado em Juiz de Fora (-21.76, -43.35), zoom 13, com 6 a 8 pontos fictícios de mock-data.ts.
- Visual neutro e provisório: a identidade visual vem na Fatia 1.
- Entregas: (1) app criado e navegação; (2) mapa; (3) Registrar e Perfil com dados fictícios; (4) PWA, testes e CI. Pare ao fim de cada uma para eu conferir.
```

**Durante:**

```text
Abra /mapa com o Playwright em 390 × 844 e 1280 × 800 e me mostre os prints. Antes da minha opinião, liste 3 problemas de usabilidade que você vê.
```

```text
Quero abrir no meu celular pela Wi-Fi. Suba o servidor acessível na rede local e me diga o endereço. Se o Next reclamar de origem cruzada, configure allowedDevOrigins só para desenvolvimento.
```

```text
Me guie para conectar o repositório à Vercel com Root Directory = web: o que eu clico no site e o que você faz aqui. Depois confira se o PR ganhou o link de preview.
```

**Aprender:**

```text
/explicar web/src/app
```

```text
Por que o mapa precisa ser um Client Component e as outras telas não? Responda com um trecho deste código e me dê um exercício pequeno para eu fazer sozinho.
```

**Fechar:** `/fechar-fatia`

---

## Fatia 1: Direção visual

**Antes:**

1. Coloque de 3 a 6 prints em `docs/design/referencias/` e preencha a tabela do README da pasta.
2. Instale o plugin: `/plugin install frontend-design@claude-plugins-official`

**Abrir** (modo de plano):

```text
/fatia 1 Instruções extras:
- Use a skill frontend-design.
- Leia as imagens e a tabela de docs/design/referencias/.
- O Lugora é um diário pessoal de lugares, com um mapa que esquenta e recomendações de quem mora na cidade. Tom: [ex.: caloroso, urbano e confiável; nada de "app de turismo genérico"].
- Crie /estilos com 3 direções bem diferentes entre si, não variações de cor da mesma ideia. Cada uma com: paleta clara e escura, tipografia, botões, o card de uma visita (lugar, nota 4,5, data, ocasião), a barra inferior e a legenda do mapa com os 4 níveis.
- Para cada direção, 3 linhas: a ideia, para quem funciona e o risco.
```

**Durante:**

```text
Tire prints de /estilos em 390 × 844, nos temas claro e escuro. Calcule o contraste do texto principal e do secundário de cada direção (meta: 4,5:1) e me mostre os números numa tabela.
```

```text
Escolho a direção [A, B ou C][, com este ajuste: ...]. Transforme em tokens no tema do Tailwind, documente cada token em docs/design/identidade.md, aplique nas telas da Fatia 0 e remova /estilos.
```

```text
Simule os 4 níveis de cor do mapa para protanopia, deuteranopia e tritanopia (um script com as matrizes de simulação serve) e me mostre se continuam distinguíveis. Se não, ajuste a luminosidade e explique a escolha.
```

**Aprender:**

```text
O que são design tokens e como o Tailwind usa os que você criou? Mostre com um componente deste projeto, em até 10 linhas.
```

**Fechar:** `/fechar-fatia`

---

## Fatia 2: Banco local e contas

**Antes:** instale o Docker Desktop, abra e espere o status "running". Depois:

```text
Confira, sem instalar nada, se o Docker está rodando (docker info) e quanta memória ele tem disponível. Me diga se dá para subir o Supabase local.
```

**Abrir** (modo de plano):

```text
/fatia 2 Instruções extras:
- Use a CLI do Supabase com npx, instalada como dependência de desenvolvimento num package.json na raiz, só para isso.
- Divida em 4 entregas, cada uma terminando com algo que eu veja:
  1) banco subindo e migrações de profiles, profiles_private, consents e app_parameters, com RLS e testes pgTAP;
  2) países e cidades do Brasil carregados pelo pipeline (DuckDB lendo o Overture e gravando no Postgres local);
  3) login por e-mail (me mostre onde ver os e-mails de teste);
  4) cadastro (18+, consentimentos, nome, @, cidade) e tela de perfil.
- Antes de cada migração, me mostre o SQL e explique as políticas de RLS em português simples.
- Login com Google: me diga o que eu precisaria criar no Google Cloud e quanto trabalho dá. Decidimos juntos se entra agora ou na Fatia 10.
```

**Depois da entrega 1:** ative o MCP do Supabase local (guia de início, seção 3).

**Durante:**

```text
Prove que as regras de acesso funcionam: rode npx supabase test db e me mostre os testes que garantem que o usuário B não lê a cidade de residência do A. Depois tente burlar pela API REST com o token do B e me mostre a resposta.
```

```text
Rode o pipeline de países e cidades e me mostre: quantos países, quantas cidades do Brasil, se Juiz de Fora tem área perto de 1.435 km² e quanto tempo levou. Rode de novo e prove que nada duplicou.
```

```text
Me mostre onde, no Studio (http://127.0.0.1:54323), eu vejo as tabelas, as políticas de RLS e os usuários de teste.
```

```text
Me guie para criar um projeto Supabase de homologação na nuvem e ligá-lo ao preview da Vercel: o que eu faço no site e o que você faz pela CLI. Peça minha confirmação antes de qualquer comando no banco remoto. Nenhuma chave service_role no app.
```

**Aprender:**

```text
/explicar supabase/migrations
```

```text
Com as políticas deste projeto: o que é RLS, como cada política decide quem vê o quê e por que a cidade fica em profiles_private, e não em profiles? Me dê um exercício: uma política para eu escrever e você corrigir.
```

**Se travar:**

```text
O npx supabase start falhou com: [cole o erro]. Diagnostique primeiro (Docker, portas, WSL 2) e me diga a causa antes de mudar qualquer arquivo.
```

**Fechar:** `/fechar-fatia`

---

## Fatia 3: Base de lugares de JF e busca

**Antes:** gere o snapshot. Em `pipelines/overture/`, rode `python relatorio_jf.py`: na primeira vez ele baixa o recorte de JF; depois, só refaz o relatório. Outra opção é copiar a pasta `dados/` da execução que você já fez.

**Abrir** (modo de plano):

```text
/fatia 3 Instruções extras:
- Reaproveite pipelines/overture/relatorio_jf.py (leitura do Overture e recorte pelo limite) em vez de reescrever. Separe em funções testáveis: limpeza (D3), deduplicação (D4) e carga.
- Testes pytest com casos reais do diagnóstico:
  - os 2 "Viva Gula" no mesmo ponto viram 1;
  - os 2 "Poleiro do Galo" (a 2,5 km um do outro) continuam separados: são duas unidades;
  - "Auto escola Brasília" e "Auto Escola Transitar" (35 m, nomes parecidos) continuam separados;
  - lugares com "Condomínio" no nome viram residenciais, não visitáveis;
  - "Santiago Lanches" (sem categoria, confiança 0,29) entra.
- A busca é uma função SQL. Antes de escrever, me explique a fórmula de ordenação com um exemplo numérico.
```

**Durante:**

```text
Rode a importação duas vezes seguidas e prove que nada duplicou (contagens antes e depois). Me mostre quantos lugares entraram, quantos foram mesclados e quantos ficaram como não visitáveis.
```

```text
Na tela Registrar, busque "poleiro", "viva gula", "santiago", "ufjf" e "condominio" e me mande os prints dos resultados.
```

**Aprender:**

```text
/explicar pipelines/overture
```

```text
Com a função de busca deste projeto: o que é pg_trgm, o que um índice GiST faz e o que é idempotência? Até 10 linhas, e um exercício no fim.
```

**Fechar:** `/fechar-fatia`

---

## Fatia 4: Registro rápido de visita e mapa

**Antes:** a fatia é o coração do produto. Em vez de deixar o Claude decidir o fluxo, faça ele te entrevistar numa sessão separada, em modo de plano:

```text
Antes de planejarmos a Fatia 4, me entreviste sobre o registro rápido usando a ferramenta de perguntas (AskUserQuestion): ordem dos campos, o que vem pré-preenchido, o que acontece depois de salvar e como mostrar o atraso de publicação. Pergunte só o que não está decidido em docs/visao/07-regras/01-visita-registro.md e docs/visao/07-regras/05-publicacao-visibilidade-e-atraso.md. No fim, escreva as decisões em docs/specs/fatia-04-registro.md.
```

Depois, `/clear`.

**Abrir** (modo de plano, sessão nova):

```text
/fatia 4 Instruções extras:
- Siga docs/specs/fatia-04-registro.md.
- Divida em 3 entregas: (1) tabelas visits, tags, visit_tags e trips com RLS e os testes 1 a 5 da seção 9.5; (2) fluxo de registro rápido (meta: menos de 20 segundos); (3) mapa com os pontos, as abas e as faixas de cor.
- As regras de publicação (7.5) ficam em funções puras, com testes Vitest para os casos de borda: viagem não encerrada, "publicar agora" e lugar sensível.
- A visibilidade é garantida no banco (RLS e consultas), não só escondida na tela.
```

**Durante:**

```text
Cronometre o registro rápido com o Playwright, como um usuário real, do toque em Registrar até salvar. Me mostre o tempo e onde dá para cortar passos.
```

```text
Entre como o usuário de teste B e prove que ele não vê a visita do A antes do publish_at nem a visita "só eu". Me mostre os testes e um print.
```

```text
Me passe o link do preview para eu testar "lugares perto de mim" no celular. O que acontece se eu negar a permissão de localização?
```

**Aprender:**

```text
/explicar diff
```

```text
Como publish_at e visibility são aplicados no banco neste projeto, e por que esconder na tela não basta? Mostre o caminho de uma visita "só eu" do banco até a tela.
```

**Fechar:** `/fechar-fatia`

---

## Fatia 5: Lugares novos e sinalizações

**Abrir** (modo de plano):

```text
/fatia 5 Instruções extras:
- Antes de codar, desenhe em Mermaid a máquina de estados do lugar (pendente → ativo → fechado ou mesclado), com o que dispara cada transição, e espere meu ok.
- Todos os números das regras (150 m, 100 m, 5 por dia, 3 visitas, 2 sinalizações, 6 meses) vêm de app_parameters.
- Escreva primeiro os testes das regras D2 e D6; depois o código.
```

**Durante:**

```text
Simule com os usuários de teste: A cria "Bar Teste" a 30 m de um lugar com nome parecido (o app deve perguntar "Você quis dizer…?"); B vê o selo "não verificado"; B e C sinalizam "fechou de vez"; o lugar some da busca e continua no histórico do A. Me mostre cada passo com prints.
```

**Aprender:**

```text
/explicar diff
```

```text
Onde cada regra da D2 e da D6 é garantida (banco ou app), e por quê? Me dê um caso de borda que os testes ainda não cobrem.
```

**Fechar:** `/fechar-fatia`

---

## Fatia 6: Cidades já visitadas e abas do mapa

**Abrir** (modo de plano):

```text
/fatia 6 Instruções extras:
- Comece pela decisão da lista mundial de cidades: compare 2 ou 3 fontes (por exemplo, localidades do Overture como pontos, filtradas por relevância) em tamanho, licença, nomes em português e custo de manter. Meça o tamanho antes de carregar qualquer coisa. Registre num ADR (skill adr) e espere minha aprovação.
- Depois: "Já estive" no cadastro e no perfil, mapa de países e estatísticas.
```

**Durante:**

```text
Com um usuário de teste, marque Paris, Lisboa e Buenos Aires como "já estive" e me mostre o mapa de países e o de cidades. Depois registre 2 visitas no mesmo lugar e prove que a profundidade não muda.
```

**Aprender:**

```text
Polígonos × pontos: qual o custo de cada um no mapa e no banco deste projeto? Até 10 linhas, com números do que carregamos.
```

**Fechar:** `/fechar-fatia`

---

## Fatia 7: Fotos

**Abrir** (modo de plano):

```text
/fatia 7 Instruções extras:
- O upload passa por uma rota no servidor do app, com a sessão do usuário. Sem service_role.
- Gere por script uma foto JPEG pequena de teste, com GPS e data nos metadados (nunca uma foto minha), e guarde como fixture dos testes.
- O teste automatizado sobe essa foto, baixa o arquivo salvo e prova que não sobrou nenhum metadado.
```

**Durante:**

```text
Suba a foto de teste e me mostre: o que o app sugeriu a partir dos metadados (data e lugar) e a lista de metadados do arquivo salvo, que tem que estar vazia.
```

**Aprender:**

```text
/explicar diff
```

```text
O que é EXIF, por que recodificar a imagem remove tudo e em que momento exato o arquivo original deixa de existir neste fluxo?
```

**Fechar:** `/fechar-fatia`

---

## Fatia 8: Perfil, estatísticas e privacidade

**Abrir** (modo de plano):

```text
/fatia 8 Instruções extras:
- Antes de codar, monte uma tabela: para cada número e mapa do perfil, quem pode ver e com quais visitas ele é calculado (seção 9.3 e ADR 0005). Espere meu ok.
- Divida em 3 entregas: (1) perfil próprio × perfil público; (2) configurações; (3) exportar dados e excluir conta.
- A exclusão de conta precisa de um teste que prove que não sobra nenhuma linha nem arquivo do usuário.
```

**Durante:**

```text
Me mostre lado a lado, em 390 × 844, o meu perfil (usuário A) e o perfil do A visto pelo B. Aponte cada diferença e a regra da seção 9.3 que a explica.
```

```text
Rode o subagente revisor-privacidade nesta branch agora, antes de fechar, e me mostre os achados.
```

**Aprender:**

```text
Como um número somado pode vazar dados mesmo com cada visita protegida? Use um exemplo com os usuários de teste deste projeto.
```

**Fechar:** `/fechar-fatia`

---

## Fatia 9: Seguir e feed

**Abrir** (modo de plano):

```text
/fatia 9 Instruções extras:
- O feed é uma view com security_invoker. Me mostre o SQL antes de criar.
- Paginação por cursor (data + id), não por número de página. Explique a diferença em 3 linhas.
- Testes: seguidor vê "seguidores"; quem não segue não vê; bloqueado não vê nada; perfil privado exige aprovação.
```

**Durante:**

```text
Com 3 usuários de teste (A segue B; C não segue ninguém; B bloqueou C), mostre o feed de cada um e prove com testes que cada um vê só o permitido.
```

**Aprender:**

```text
/explicar diff
```

**Fechar:** `/fechar-fatia`

---

## Fatia 10: Atualização da base e preparação do beta

**Antes:** a Fase 0 terminou e os registros estão num arquivo fora do git.

**Abrir** (modo de plano):

```text
/fatia 10 Instruções extras:
- Divida em 4 entregas: (1) atualização mensal incremental pelo changelog do Overture; (2) ambiente de produção (Supabase e Vercel); (3) termos de uso, política de privacidade e página Sobre com a atribuição; (4) eventos de métricas e importação da Fase 0.
- Para a produção, me dê um checklist do que eu faço no site e do que você faz pela CLI. Peça confirmação antes de qualquer comando no banco remoto.
- Termos e política: rascunho em linguagem simples, marcado como "a revisar por advogado".
```

**Durante:**

```text
Rode a atualização incremental duas vezes com a mesma versão do Overture e prove que nada mudou na segunda. Me mostre as linhas gravadas em overture_imports.
```

```text
Rode os 9 testes de aceitação da seção 9.5 contra a homologação e me mostre o resultado de cada um.
```

```text
Importe os registros da Fase 0 (arquivo em [caminho, fora do git]) e me diga quantos lugares digitados pelas pessoas a base encontrou, quantos precisaram ser criados e quantos ficaram ambíguos.
```

**Portão do beta:**

```text
Confira o "Portão do beta" do roadmap item por item, com evidência para cada um, e me diga o que falta.
```

**Fechar:** `/fechar-fatia`

---

## Para qualquer momento

**Ideia nova** (registra e volta ao trabalho):

```text
/ideia [descreva a ideia]
```

**Bug:**

```text
Bug: fiz [passos], esperava [resultado] e aconteceu [o que viu]. [cole o print] Escreva primeiro um teste que reproduz o bug, depois corrija a causa raiz e prove que o teste passa.
```

**Comando com erro:**

```text
O comando [comando] falhou com: [cole o erro]. Encontre a causa raiz antes de mudar qualquer arquivo, me explique em 3 linhas, corrija e prove que passou. Não desative regras de lint nem de tipos.
```

**Corrigiu duas vezes e não resolveu:** mande `/clear` e depois:

```text
Contexto: na fatia [N], tentamos [o que foi tentado] e não funcionou porque [motivo]. Objetivo: [o que precisa acontecer]. Use um subagente para investigar a causa antes de propor uma solução.
```

**Revisão independente** (além do `/code-review`):

```text
Use um subagente para revisar o diff desta branch contra os critérios de aceite da fatia [N] no roadmap. Reporte só lacunas de correção ou de requisito, não preferências de estilo.
```

**Entender um conceito:**

```text
Explique [conceito] com um exemplo deste projeto, em até 10 linhas, e me dê um exercício para eu fazer sozinho.
```

**Pausar:**

```text
Vou pausar. Resuma em 5 linhas onde paramos na fatia atual: o que está pronto, o que falta e o próximo passo. Anote isso no roadmap, embaixo da fatia.
```

Para retomar, rode `claude --continue` no terminal. Ele reabre a última conversa desta pasta.

**O Claude repetiu um erro:**

```text
Você repetiu [o erro]. Adicione uma regra curta no CLAUDE.md, ou em .claude/rules se valer para uma pasta só, para isso não se repetir. Me mostre o diff.
```

**A cada 3 fatias:** `/doctor`, que revisa o `CLAUDE.md` e propõe cortes.

**Promover uma ideia:**

```text
A ideia [N] de docs/ideias-para-depois.md tem evidência: [qual]. Proponha em que fase e fatia ela entra, o que sai ou espera para ela caber e a métrica de sucesso. Não implemente nada.
```
