# 0005. Privacidade nos números e mapas públicos

- **Status:** aceita (documento de visão v0.5)
- **Data:** 2026-10-23

## Contexto

Cada visita tem visibilidade própria (pública, seguidores ou só eu), mas números e mapas somados podem revelar o que a pessoa escondeu:

- o hexágono mais quente do mapa público aponta o bairro onde ela mora;
- uma média com uma visita "só eu" revela que alguém foi ao lugar;
- "100% moradores" com duas avaliações revela onde essas pessoas moram.

Além disso, no Postgres, views ignoram as regras de acesso (RLS) por padrão.

## Opções consideradas

1. **Agregados com todas as visitas, exibidos a partir de um mínimo de pessoas:** mais dados para o índice. Contra: ainda vaza em grupos pequenos, e o usuário não entende por que uma visita "só eu" influencia um número público.
2. **Agregados só com o que quem vê tem permissão de ver:** regra simples de explicar e de testar. Contra: o índice morador × visitante usa menos dados.

## Decisão

Opção 2, mais o mínimo de 5 pessoas por grupo para o percentual de moradores, porque ele deriva da cidade de residência, que é privada. Na implementação:

- views expostas com `security_invoker = true`;
- views materializadas e agregados fora do schema `public`;
- testes de aceitação da seção 9.5.

## Consequências

- Toda tela que mostra número ou mapa de outra pessoa precisa saber quem está vendo.
- O revisor de privacidade (`.claude/agents/revisor-privacidade.md`) confere essas regras antes de fechar cada fatia.
- Se o índice da Fase 3 não tiver volume, a decisão pode ser revista, mas nunca para incluir visitas "só eu" em números públicos.
