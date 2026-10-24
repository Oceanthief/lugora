# 7.11 Índice morador × visitante (Fase 3)

- **Morador:** visita feita por quem, no momento do registro, tinha aquela cidade como residência (`eh_morador` verdadeiro).
- **Indicadores por lugar:** % de avaliadores moradores (pessoas distintas), nota média dos moradores, nota média dos visitantes e a diferença entre elas.
- **Base de cálculo:** só visitas públicas (seção 9.3).
- **Mínimo para exibir:** 5 avaliadores em cada grupo comparado (parâmetro). Abaixo disso, “dados insuficientes”. O mínimo tem dupla função: estabilidade estatística e proteção da cidade de residência de quem avaliou, que é privada.
- **Média bayesiana:** nota ajustada = (v × m + k × C) ÷ (v + k), em que v é o número de avaliações do lugar, m a média do lugar, C a média geral da cidade e k um peso (parâmetro, por exemplo 10). Na prática, um lugar com uma única nota 5 não passa à frente de um com 200 notas e média 4,7.

| Rótulo | Regra (parâmetros) |
| --- | --- |
| Favorito dos moradores | 70% ou mais de avaliadores moradores e nota ajustada de 4,0 ou mais |
| Popular entre visitantes | 70% ou mais de avaliadores visitantes |
| Moradores e visitantes discordam | Diferença entre as notas de 1,0 estrela ou mais; mostrar as duas notas |

Nunca usar “armadilha” nem qualquer rótulo negativo sobre o negócio. O app mostra os dados; o usuário conclui.


---
Parte do documento de visão do Lugora (v0.5.1). Índice: [README](../README.md).
