# 0010. Busca de lugares e revisão manual da deduplicação

- **Status:** aceita (Fatia 3)
- **Data:** 2026-11-04

## Contexto

A D1 manda ordenar a busca por semelhança do texto, distância, visitas no Lugora e confiança. A D4 manda mesclar sozinho só o nome idêntico a até 50 m e deixar os nomes parecidos para uma pessoa decidir. Três medições com os 19.459 registros de Juiz de Fora mostraram o que faltava definir:

- Só com um limite de semelhança, "poleiro" trazia "Casa do Oleiro" e um estúdio de pilates de sobrenome parecido, e o critério de aceite exige 2 resultados.
- No empate do texto, a distância colocava "Santiago Advogados" antes de "Santiago Lanches", porque o escritório fica mais perto.
- Depois das mesclas da revisão, quem digitava "Posto Rumo Certo" não achava mais o "POSTO TOP CENTRO", contrariando a D1: quem digita o nome certo sempre encontra o lugar.

## Opções consideradas

1. **Nota única, somando texto, distância e confiança com pesos:** um número só. Contra: pesos difíceis de explicar e de ajustar, e a distância pode vencer o nome.
2. **Critérios em sequência, com a semelhança arredondada a uma casa:** simples de explicar, e a distância só decide quando o texto empata de verdade.
3. **Índice de texto (GIN com `pg_trgm`):** padrão para buscas grandes. Contra: nesta base, não mudou o tempo (cerca de 50 ms nos dois casos).

## Decisão

Opção 2, em `search_places`, sem índice de texto por enquanto:

1. **Texto:** o nome exato vem primeiro; depois, a semelhança arredondada a uma casa.
2. **Visitável antes de serviço,** quando o texto empata. Não está na D1: foi decisão do Victor, sem mudar o documento de visão.
3. **Distância,** só para quem deu o consentimento de localização. A posição não fica guardada e não vai na URL.
4. **Visitas no Lugora:** entram na Fatia 4, quando existirem.
5. **Confiança.**

**O que aparece:** se algum nome contém a palavra digitada (semelhança de 0,9 ou mais), só esses aparecem. Se nenhum contém, a busca tolera erro de digitação (0,5 ou mais). Os dois limites ficam em `app_parameters`.

**O que não é visitável:** continua aparecendo pelo nome, como a D3 pede, com um aviso discreto. Só os residenciais não podem ser escolhidos.

**Revisão manual:** a fila é um CSV fora do git, porque ainda não há tela para revisar. As decisões vão para `pipelines/overture/decisoes_revisao.csv`, que fica no git só com identificadores, sem os nomes da base, e sobrevive a um `db reset`. O nome de um registro mesclado continua valendo para a busca, em `other_names`, sem aparecer na tela.

## Consequências

- A busca lê a semelhança de todos os lugares ativos a cada pedido: leva de 60 a 90 ms com 19 mil lugares. Com mais cidades, o índice de texto volta a fazer sentido, e a Fatia 10 é um bom momento para medir de novo.
- A D4 cita a faixa de 0,90 a 0,97 para a revisão, mas o exemplo dela ("Nave Estúdio" × "NAVE Studio") dá 0,983. Todo nome diferente a partir de 0,90 vai para a revisão, porque só a igualdade exata mescla sozinha.
- A regra do nome da D3 marca como residencial um hotel de verdade, o "Serrano Residencial Hotel". Ele aparece, mas não pode ser escolhido, até a correção de categoria da Fatia 5.
- "Praia do Norte JF" são quadras de areia, com a categoria errada no Overture. Ela continua na busca, com o aviso de fora da lista, até a mesma correção.
- Desfazer uma decisão da revisão exige editar o arquivo e recriar o banco: a importação não reabre um lugar fechado, para não desfazer no futuro um fechamento feito pelos usuários (D2).
