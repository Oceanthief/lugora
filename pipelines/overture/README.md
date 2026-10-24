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

## Privacidade e atribuição

- **Sem contatos:** o script não copia e-mails nem telefones.
- **Base bruta fora do repositório:** ela contém nomes de profissionais autônomos, então só o script e os números agregados são publicados.
- **Licenças e créditos:** dados de lugares © Overture Maps Foundation, com licenças por fonte (Meta e outras: CDLA Permissive 2.0; Foursquare: Apache 2.0; AllThePlaces: CC0). Limites © OpenStreetMap contributors (ODbL).
