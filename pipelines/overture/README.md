# Diagnóstico da base de lugares: Overture Maps em Juiz de Fora

**Pergunta:** a base aberta do [Overture Maps](https://overturemaps.org) serve como catálogo de lugares do Lugora em Juiz de Fora?

**Resposta curta:** a cobertura é ótima; a qualidade dos campos, irregular. O Overture serve como base, não como fonte de verdade. As regras que tratam isso estão na seção 7.2 do documento de visão (D1 a D5) e no [ADR 0004](../../docs/decisoes/0004-base-de-lugares-overture.md).

## Como rodar

```bash
pip install -r requirements.txt
python relatorio_jf.py                      # baixa o recorte (na primeira vez) e gera o relatório
python relatorio_jf.py --atualizar          # baixa de novo
python relatorio_jf.py --release AAAA-MM-DD.0
```

- **Saídas:** `relatorio/relatorio_jf.html` e `relatorio/jf_lugares.csv` (separado por `;`, pronto para Power BI).
- **Cópia local:** `dados/`. É o snapshot da versão usada, porque o Overture tira versões do ar em cerca de 60 dias.
- **Amostra:** `amostra.csv` (colunas `nome`, `grupo`, `situacao_real`) transforma o teste manual em teste reproduzível: o script procura cada nome por similaridade e mostra o que achou.

## Método

1. Limite oficial do município pelo tema *divisions*. O polígono do tipo `locality` cobre cerca de 1.435 km², a área oficial de Juiz de Fora.
2. Lugares dentro do retângulo do município, lidos direto do S3 público com DuckDB (só as partes necessárias dos arquivos).
3. Recorte pelo polígono e cópia local, sem e-mails nem telefones.
4. Métricas: completude dos campos, confiança, status de funcionamento, categorias, fontes, recência e possíveis duplicatas (nomes com similaridade Jaro-Winkler de 0,9 ou mais, a até 50 m).

## Achados (release 2026-10-21.0)

| Indicador | Resultado |
| --- | --- |
| Lugares no município | 19.459 |
| Teste manual (botecos de bairro, recém-abertos, parques, nicho) | 30 de 30 encontrados |
| Com categoria | 96,5% |
| Com endereço | 97,3% |
| Com status de funcionamento | 3 (0,0%) |
| Confiança mediana | 0,64 |
| Descartados por um corte em confiança ≥ 0,5 | 33,4% |
| Vindos de páginas no Facebook/Instagram (Meta) | 96,4% |
| Possíveis duplicatas | 78 pares (0,4%), 20 no mesmo ponto |
| Parques e praças | 54 + 39 |

**Problemas de qualidade, com exemplos reais:**

- **Status:** a base praticamente não informa o que fechou.
- **Confiança:** não é filtro. Um lanche de bairro aberto tem confiança 0,29, e lugares reais aparecem abaixo de 0,2.
- **Categoria:**
  - 248 "locais históricos" são quase todos condomínios e edifícios;
  - páginas sobre praias de outras cidades aparecem localizadas em Juiz de Fora;
  - um estacionamento está como parque;
  - o Restaurante Universitário da UFJF está sem categoria.
- **Duplicatas:** o mesmo restaurante aparece duas vezes no mesmo ponto, com o mesmo endereço.
- **Filiais:** 1.935 pares de registros têm nome idêntico a mais de 500 m um do outro (redes, farmácias, lanchonetes). Deduplicar só pelo nome juntaria unidades diferentes.
- **Cobertura desigual:** lugares sem página em rede social (praças, mirantes) são o ponto fraco.

## Decisões que saíram daqui

- **D1:** importar tudo e usar a confiança só para ordenar a busca.
- **D2:** botão "este lugar fechou".
- **D3:** tabela de correspondência de categorias e lista de lugares visitáveis.
- **D4:** regra de deduplicação (igualdade exata mescla sozinha; similaridade alta vai para revisão).
- **D5:** lista concreta de categorias sensíveis (religião e saúde).

## O que aprendi

- **Cobertura não é qualidade.** Achar todos os lugares de teste não garante categoria, status nem unicidade certos.
- **Confira o dado antes de usá-lo como exemplo.** Um restaurante que parecia duplicado eram duas unidades a 2,5 km. Isso virou um caso de teste da deduplicação.
- **Métricas precisam ser validadas.** A primeira versão da métrica de recência contava a data que o próprio Overture carimba em todo registro a cada versão, e mostrava "100% atualizado". A correção considera só a data da fonte original.
- **Esquemas de dados abertos mudam.** Entre versões, `categories` virou `basic_category` e `taxonomy`. O script confere as colunas antes de montar a consulta.

## Países e cidades (`importar_divisoes.py`)

Carrega no banco os países e os municípios do Brasil, com os limites do Overture e os nomes oficiais do IBGE ([ADR 0008](../../docs/decisoes/0008-paises-e-cidades-overture-ibge.md)).

```bash
pip install -r requirements.txt
cp .env.example .env                  # endereço do banco local; o .env fica fora do git
python importar_divisoes.py           # usa a cópia local, se houver
python importar_divisoes.py --atualizar
```

- **Precisa** do banco local no ar (`npx supabase start`, na raiz).
- **Idempotente:** rodar de novo a mesma release mostra "0 novos, 0 alterados" e não apaga nada.
- **Depois de um `npx supabase db reset`,** rode de novo: o reset apaga a carga e deixa só o que está no seed.
- **Resultado na release 2026-10-21.0:** 5.571 municípios, 219 países e territórios (97 MB + 188 MB no banco), Juiz de Fora com 1.436,8 km². Com a cópia local, a execução leva de 2 a 3 minutos; na primeira vez, soma-se o download.

## Lugares de Juiz de Fora (`importar_lugares.py`)

Carrega no banco os lugares do snapshot gerado pelo `relatorio_jf.py`, com as regras da seção 7.2:

- **D1:** importa tudo, sem corte de confiança e sem contatos.
- **D3:** aplica a `category_map`, e nomes como "condomínio" e "edifício" viram residenciais, não visitáveis.
- **D4:** só nome idêntico a até 50 m mescla sozinho. Filiais a mais de 50 m ficam separadas.

```bash
python importar_lugares.py              # usa o snapshot local, se houver
python importar_lugares.py --atualizar  # baixa de novo
```

- **Precisa** do banco local no ar e de Juiz de Fora em `cities`, que já vem no seed.
- **Idempotente:** rodar de novo mostra "0 novos, 0 alterados". Cada execução grava uma linha em `overture_imports`.
- **Resultado na release 2026-10-21.0:** 19.459 registros viram 19.419 lugares, com 40 mesclados. Na busca ficam 19.411 ativos: 4.365 visitáveis, 1.961 sensíveis e 270 residenciais.
- **Diferença em relação à D4:** o documento cita a faixa de similaridade de 0,90 a 0,97, mas o exemplo dele ("Nave Estúdio" × "NAVE Studio") dá 0,983, e o par "Auto escola Brasília" × "Auto Escola Transitar", citado como separado, dá 0,93. Por isso, todo nome diferente a partir de 0,90, a até 50 m e do mesmo grupo, vai para a revisão; nenhum deles mescla sozinho.

### Revisão manual

Nomes parecidos e praias em cidade sem litoral vão para `relatorio/fila_revisao_lugares.csv`, fora do git. Nada ali é mesclado sozinho.

1. Abra o arquivo e escreva, na coluna `REVISÃO`, "São a mesma coisa", "São lojas diferentes", "Existe" ou "Não existe" ("Não tem..." também vale).
2. Rode `python importar_lugares.py`.

| Decisão | O que acontece |
| --- | --- |
| Mesma coisa | Os dois viram um lugar só. O GERS do outro fica em `merged_gers_ids`, e o nome dele, em `other_names`, para a busca continuar achando |
| Diferentes | Continuam separados e saem da fila |
| Existe | O lugar continua na busca e sai da fila |
| Não existe | O lugar sai da busca (`status = 'closed'`), sem ser apagado |

- **As decisões não se perdem:** antes de regravar a fila, o script as copia para `decisoes_revisao.csv`, que fica no git e só tem identificadores. Assim, elas sobrevivem a um `db reset`.
- **Uma resposta que o script não entende** interrompe a execução antes de mexer em qualquer arquivo.
- **Para desfazer uma decisão:** edite `decisoes_revisao.csv`, rode `npx supabase db reset` e carregue tudo de novo.

## Privacidade e atribuição

- **Sem contatos:** o script não copia e-mails nem telefones, nem os que vêm no meio do texto. Endereço com contato ou link fica inteiro de fora, e o CEP só entra se tiver formato de CEP. Faixas de números ("2998-3000", "sala 1801-1803") não contam como telefone; na dúvida, conta. O lugar continua na base. A cópia local em `dados/` guarda o texto como veio, e por isso fica fora do git.
- **Nomes de pessoas:** testes e documentos usam nomes fictícios, porque o repositório é público.
- **Base bruta fora do repositório:** ela contém nomes de profissionais autônomos, então só o script e os números agregados são publicados.
- **Licenças e créditos:** dados de lugares © Overture Maps Foundation, com licenças por fonte (Meta e outras: CDLA Permissive 2.0; Foursquare: Apache 2.0; AllThePlaces: CC0). Limites © OpenStreetMap contributors (ODbL). Lista de municípios: IBGE.
