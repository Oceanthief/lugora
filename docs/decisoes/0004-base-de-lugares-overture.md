# 0004. Base de lugares: Overture Maps

- **Status:** aceita (documento de visão v0.3)
- **Data:** 2026-10-23

## Contexto

O Lugora precisa de um catálogo de lugares para o usuário escolher ao registrar uma visita, sem cadastrar tudo do zero. O diagnóstico de Juiz de Fora (`pipelines/overture/`) mediu a base do Overture:

- 19.459 lugares no município;
- 30 de 30 lugares de teste encontrados;
- 96,4% vindos de páginas no Facebook e Instagram (Meta);
- 3 lugares com status de funcionamento informado;
- erros de categoria (condomínios classificados como local histórico);
- 78 pares de possíveis duplicatas.

## Opções consideradas

1. **Overture Maps:** aberta e gratuita, consultável com DuckDB, atualização mensal, identificador global estável (GERS). Contra: qualidade irregular de categoria e status.
2. **Google Places:** provavelmente a melhor cobertura. Contra: pago, só pode ser exibido sobre o mapa do Google, e só o ID do lugar pode ser armazenado.
3. **Foursquare OS Places sozinha:** aberta. Contra: já entra no Overture como uma das fontes.
4. **OpenStreetMap direto:** ótimo para praças e parques. Contra: cobertura menor de comércio de bairro.

## Decisão

Opção 1, como base e não como fonte de verdade. As regras D1 a D6 da seção 7.2 do documento tratam os pontos fracos: importar tudo e usar a confiança só para ordenar, botão "fechou", correspondência de categorias, deduplicação, categorias sensíveis e criação de lugares pelos usuários.

## Consequências

- O pipeline guarda um snapshot de cada versão usada, porque o Overture tira as versões do ar depois de cerca de 60 dias.
- A atualização mensal é incremental, pelo changelog (seção 10).
- Atribuição obrigatória: "Overture Maps Foundation" e "© OpenStreetMap contributors".
