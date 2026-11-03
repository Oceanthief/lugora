# 0008. Países e cidades: polígonos do Overture, lista oficial do IBGE

- **Status:** aceita (Fatia 2)
- **Data:** 2026-11-03

## Contexto

A seção 7.3 define cidade como município, com um pipeline só a partir do tema divisions do Overture. A tabela da seção 8 ainda fala em "IBGE no Brasil; Overture no exterior".

Na prática, o tipo `locality` do Overture traz 6.360 registros no Brasil, contra 5.571 municípios do IBGE. Os 789 a mais são distritos, povoados e comunidades. Alguns têm o nome do município (Pedra Branca, no Ceará, aparece com 0,1 km² e com 1.328,8 km²), e 9 municípios têm grafia diferente nas duas fontes.

## Opções consideradas

1. **Importar todo `locality`:** simples, mas a pessoa veria povoados como cidade no cadastro, contra a regra "cidade = município".
2. **Baixar a malha municipal do IBGE:** oficial, mas é uma segunda fonte de polígonos, um segundo formato e um pipeline diferente para o exterior.
3. **Polígonos do Overture, filtrados pela lista de municípios do IBGE:** um formato só e nomes oficiais. Contra: depende de casar nomes entre as duas fontes.

## Decisão

Opção 3, em `pipelines/overture/importar_divisoes.py`:

- O polígono vem do Overture; o nome e a UF vêm do IBGE.
- Nomes são comparados sem acentos, maiúsculas nem pontuação, dentro da mesma UF.
- Quando há mais de um polígono com o mesmo nome e UF, fica o maior, que é o município inteiro.
- As 9 grafias diferentes ficam numa tabela no script, conferidas por UF e área. Em Brasília, o Overture usa "Plano Piloto", cujo polígono cobre o DF inteiro.
- `cities.gers_id` guarda o `division_id` do Overture e é a chave da atualização; em países, a chave é `iso_code`.

Resultado na release 2026-10-21.0: 5.571 de 5.571 municípios com polígono. A soma das áreas dá 99,9% da área do Brasil, e Juiz de Fora tem 1.436,8 km².

## Consequências

- A tabela de grafias pode precisar de novas linhas em releases futuras. O script lista os municípios sem polígono, em vez de falhar calado.
- O `npx supabase db reset` apaga a carga. O seed mantém o Brasil e Juiz de Fora, e o pipeline recarrega o resto a partir da cópia local, em poucos minutos.
- `countries` tem 198 países com código ISO e 21 territórios em disputa com código `X?`, que não é ISO (Kosovo, Gaza, Cisjordânia). Territórios como Hong Kong, Macau, Groenlândia e Porto Rico não aparecem como país. Isso não afeta o cadastro, que só usa cidades do Brasil. A forma de mostrar esses casos fica para a Fatia 6.
- O exterior ainda não tem cidades. Quando entrar, precisa de uma regra própria (Paris = comuna; ver a seção 14).
