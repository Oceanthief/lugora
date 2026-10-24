# 7.4 Mapa

- **Camada 1, amplitude:** cidade ou país visitado (por visita ou pela marcação “já estive”) recebe a cor base.
- **Camada 2, profundidade:** número de lugares distintos avaliados. Visitas repetidas não esquentam o mapa, o que evita registrar lixo só para colorir.
- **Abas:** Viagens (fora da cidade de residência) e Minha cidade.
- **Forma:** países como polígonos; cidades como pontos no v1 e hexágonos H3 na Fase 2. O H3 é uma grade de hexágonos criada pela Uber: cada visita “acende” um hexágono, como a névoa de um jogo sendo revelada.
- **Cores:** paleta sequencial com variação de luminosidade (do claro ao escuro), segura para daltônicos; legenda sempre visível; lista e estatísticas como alternativa ao mapa.
- **Compartilhar:** imagem vertical 9:16, pronta para story (Fase 2).
- **Perfil público:** quem visita o perfil vê o mapa em resolução grossa e sem o rótulo “Minha cidade”; o detalhe fino é só do dono (seção 9.3).

| Faixas (parâmetro) | Nível 1 | Nível 2 | Nível 3 | Nível 4 |
| --- | --- | --- | --- | --- |
| Cidade: lugares distintos | 1 | 2 a 5 | 6 a 15 | 16 ou mais |
| País: lugares distintos | 1 | 2 a 10 | 11 a 30 | 31 ou mais |


---
Parte do documento de visão do Lugora (v0.5.1). Índice: [README](../README.md).
