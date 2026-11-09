# 0011. Publicação das visitas, viagens e colunas escondidas da API

- **Status:** proposta
- **Data:** 2026-11-09

## Contexto

A seção 7.5 segura cada visita antes de ela aparecer para os outros: 24 h na cidade de residência, ou até a viagem acabar, seja pela pessoa, seja sozinha, 3 dias depois do último registro fora de casa. O `CLAUDE.md` manda mostrar a data da visita, nunca a hora. Três problemas apareceram na Fatia 4:

- A API do Supabase devolve toda coluna que o papel pode ler. Com o instante exato da publicação (`publish_at`), quem vê a visita calcularia a hora do registro. `created_at` e `updated_at` dizem o mesmo. `is_resident` e `trip_id` dizem se a pessoa estava fora de casa e quais visitas foram na mesma viagem.
- Encerrar a viagem "sozinha" parece pedir algo que rode sem ninguém pedir.
- O que depende da cidade de residência e da viagem aberta não pode vir do app, porque quem chama a API direto mandaria o que quisesse.

## Opções consideradas

1. **Agendador (`pg_cron`) para encerrar viagens:** encerra na hora certa. Contra: mais uma peça para configurar e testar em cada ambiente; se ela falhar, as visitas ficam presas.
2. **Encerramento pela data:** a viagem está aberta enquanto `closes_at` não passou. Nada precisa rodar. Contra: as visitas da viagem precisam acompanhar cada mudança de `closes_at`.
3. **Expor `publish_at` e esconder a hora na tela:** simples. Contra: a hora sai para quem chama a API direto.
4. **Uma view só com as colunas permitidas:** padrão. Contra: são duas portas para a mesma tabela, e a view precisa repetir as regras.

## Decisão

Opção 2, com permissões por coluna, em vez de view:

- **Colunas:** a API lê só `id`, `user_id`, `place_id`, `visited_on`, `rating`, `visibility` e `publish_on`. `publish_on` é a data no fuso de São Paulo, gerada pelo próprio banco. A hora, `is_resident`, `trip_id`, `created_at` e `updated_at` não saem, nem para a dona. O RLS escolhe as linhas, e as permissões escolhem as colunas.
- **Quem calcula:** o gatilho `prepare_visit`, com as permissões do dono, preenche `is_resident`, a visibilidade padrão (lugar sensível nasce "só eu"), `publish_at` e a viagem. A pessoa só manda lugar, data, nota, etiquetas e visibilidade.
- **Viagem:** cada visita fora de casa cria a viagem ou adia `closes_at` para 3 dias depois (`trip_auto_close_after`). O gatilho `sync_trip_visits` leva junto as visitas da viagem ainda não publicadas. Visita já publicada não muda.
- **Só antecipar:** "Publicar agora" e "Encerrar viagem" mudam só `publish_at` e `closes_at`, e dois gatilhos recusam adiar. Eles separam a pessoa (papel `authenticated`) das funções do sistema, que podem adiar a viagem.
- **O mapa da dona:** precisa saber o que foi em casa e o que foi viagem. Lê pela função `my_visited_places`, com as permissões do dono, sem parâmetro, que só devolve as visitas de quem chama.

## Consequências

- O app não sabe pela API se a visita entrou numa viagem. Deduz pela mesma regra do banco: a cidade do lugar, a de residência e a viagem aberta.
- **Risco que continua:** quem pode ver as visitas de alguém e consulta a API a cada minuto anota quando cada uma aparece. Isso dá a hora aproximada do registro em casa (24 h antes), não a da visita, que pode ter sido em outro dia. Se for preciso, dá para publicar em lotes, uma vez por dia. Revisar no portão do beta.
- A viagem acaba sem nenhum evento, então ninguém é avisado na hora. Se uma fatia trouxer o aviso "sua viagem acabou", aí o agendador entra.
- Coluna nova em `visits` não sai pela API até ganhar permissão. Isso protege por padrão, mas é preciso lembrar de conceder quando uma tela precisar dela.
- Editar e excluir uma visita não existem pela API: é a ideia 4 de `docs/ideias-para-depois.md`.
