# 7.2 Base de lugares, importação e deduplicação

Diagnóstico da Overture em Juiz de Fora (release 2026-10-21.0, feito com o script `relatorio_jf.py`). Estes números sustentam as decisões D1 a D5 abaixo.

| Indicador | Resultado | O que significa |
| --- | --- | --- |
| Lugares no município | 19.459 | Cobertura ótima, inclusive de comércio de bairro |
| Origem Meta (páginas no Facebook/Instagram) | 96,4% | Ter página não prova que o lugar existe nem que está aberto |
| Com status de funcionamento | 3 (0,0%) | A base não sabe o que fechou |
| Confiança mediana | 0,64 | Abaixo de 0,5 ficam 33,4% da base, com muitos lugares reais |
| Com categoria | 96,5% | Mas com erros: 248 “locais históricos” são quase todos condomínios |
| Possíveis duplicatas | 78 pares (0,4%) | 20 deles no mesmo ponto exato |
| Parques e praças | 54 + 39 | Ponto fraco: lugares sem página no Facebook |
| Categorias sensíveis | ~780 religiosas · ~1.180 de saúde | A regra “só eu” da seção 7.5 tem volume real |

## D1. Importar tudo e usar a confiança só para ordenar

- **Nenhum corte de confiança na importação.** Abaixo de 0,2 aparecem lugares reais (restaurante de bairro, estúdio de yoga); o Santiago Lanches, aberto, tem 0,29. Um corte em 0,5 descartaria 6.495 lugares.
- **Por quê:** a confiança mede a chance de o lugar existir e não é comparável entre fontes, segundo a própria documentação do Overture. Serve para ordenar, não para excluir.
- **Busca:** ordenar por (1) semelhança com o texto digitado, (2) distância, (3) visitas no Lugora, (4) confiança. Quem digita o nome certo sempre encontra o lugar.
- **Sugestões e descoberta:** não exibir lugar com confiança abaixo de 0,2 (parâmetro) que ainda não tenha nenhuma visita no Lugora. Uma visita real vale mais que a confiança da base.
- **Guardar na tabela Lugar:** `confianca`, `fontes` e `id_externo` (o GERS, identificador global do Overture), para medir depois se a confiança prevê visitas reais.

## D2. Botão “este lugar fechou” (Fase 1)

- **Motivo:** a Overture praticamente não informa status (3 de 19.459). Sem esse botão, o app sugere lugares que não existem mais, e a confiança no produto cai.
- **Sinalizações disponíveis em qualquer lugar:** fechou de vez · fechou temporariamente · mudou de endereço · categoria errada · não existe ou está duplicado.
- **Regra de fechamento (parâmetros):** o lugar vira “fechado” com 2 sinalizações de usuários diferentes; ou com 1 sinalização e nenhuma visita nos últimos 6 meses.
- **Sinal automático:** lugar removido da Overture e não reencontrado na atualização mensal conta como 1 sinalização (seção 10). Lugar com visita no Lugora nos últimos 6 meses continua ativo: uma visita real vale mais que a base.
- **Anti-abuso:** só sinaliza quem tem pelo menos 3 visitas registradas. Uma visita nova depois da sinalização cancela a pendência; uma visita depois do fechamento abre revisão (“reabriu?”).
- **Efeito:** lugar fechado some da busca e da descoberta, mas continua no histórico e no mapa de quem visitou, com o selo “fechado”. Memória não se apaga.

## D3. Correspondência de categorias e lista de visitáveis

- **Problema:** as categorias do Overture (`basic_category`, cerca de 280 valores) têm erros e misturam “lugar para visitar” com serviço. Um terço da base é imobiliária, advocacia, serviço em domicílio ou B2B. Exemplos: condomínios como “local histórico”, páginas sobre praias de Búzios localizadas em JF, estacionamento como “parque”; 3,5% sem categoria (incluindo o Restaurante Universitário da UFJF).
- **Solução:** uma tabela `categoria_mapa` mantida pelo projeto: categoria do Overture → categoria do Lugora, grupo, `visitavel` (sim/não) e `sensivel` (sim/não).
- **Regras de limpeza na importação:** nome com “condomínio”, “edifício”, “residencial” ou “conjunto residencial” → categoria “residencial”, não visitável. Categoria geograficamente impossível (praia em cidade sem litoral) → fila de revisão.
- **Não visitáveis continuam na base:** podem ser encontrados pelo nome, mas não aparecem em sugestões, descoberta nem estatísticas de cidade.
- **Correção pelo usuário:** “categoria errada” (D2) sugere a categoria certa; com 2 sugestões iguais, o lugar ganha uma correção própria, que tem prioridade sobre a do Overture.
- **Sem categoria:** o primeiro usuário a registrar visita escolhe a categoria.

| Grupo visitável | Categorias do Overture (ponto de partida) |
| --- | --- |
| Comer e beber | restaurant, casual_eatery, fast_food_restaurant, bar, cafe, bakery, smoothie_juice_bar |
| Cultura | museum, art_gallery, library, movie_theater, theatre_venue, performing_arts_venue, arts_and_entertainment, monument, historic_site (após limpeza) |
| Ar livre | park, public_plaza, garden, nature_reserve, waterfall, lake, zoo, skate_park, dog_park |
| Esporte | stadium_arena, gym, fitness_studio, sport_or_fitness_facility, swimming_pool |
| Passeio e compras | shopping_mall, books_music_and_video_store, arts_crafts_and_hobby_store, amusement_park |
| Hospedagem | hotel, lodging |

_Fora da lista por padrão: serviços profissionais, financeiros, imobiliários, jurídicos, automotivos, domésticos, B2B e de beleza. A lista é revisada após a Fase 0, com base no que as pessoas realmente registram._

## D4. Regra de deduplicação

| Situação | Ação | Exemplo real em JF |
| --- | --- | --- |
| Nome normalizado idêntico e até 50 m | Mescla automática | Viva Gula duas vezes no mesmo ponto, com o mesmo endereço |
| Similaridade de 0,90 a 0,97, até 50 m e mesmo grupo de categoria | Fila de revisão manual | “Nave Estúdio” × “NAVE Studio” |
| Nome idêntico a mais de 50 m | Lugares separados (provável filial) | Poleiro do Galo: duas unidades a 2,5 km uma da outra |
| Similaridade menor ou grupos diferentes | Lugares separados | “Auto Escola Brasília” × “Auto Escola Transitar” |

- **Nome normalizado:** minúsculas, sem acento, sem pontuação e sem espaços repetidos.
- **Filiais:** em Juiz de Fora, 1.935 pares de registros têm nome idêntico a mais de 500 m um do outro (redes, farmácias, lanchonetes). Por isso a deduplicação nunca usa só o nome, e a busca sempre mostra endereço ou bairro.
- **Na mescla,** o principal é o registro com mais fontes e, em empate, maior confiança. Os GERS dos demais ficam guardados em `ids_externos`, para que a próxima importação mensal não recrie a duplicata.
- **Cuidado com o algoritmo:** a similaridade Jaro-Winkler dá peso extra ao começo do nome, e por isso nomes que começam igual (“Auto Escola…”, “Condomínio do Edifício…”) parecem iguais. Por isso só a igualdade exata mescla sozinha.
- **Ao criar lugar pelo app:** buscar candidatos num raio de 150 m (parâmetro) e perguntar “Você quis dizer…?”. Isso é *entity resolution*: decidir se dois registros são a mesma coisa no mundo real.
- **Lugar criado por usuário:** regras de criação e verificação na D6.
- **Fusão no app:** um lugar vira “mesclado”, aponta para o principal e suas visitas migram.
- **Lugares sem endereço** (parques, mirantes, trilhas) usam só coordenadas.

## D5. Categorias sensíveis

| Tipo | Categorias do Overture marcadas como `sensivel` |
| --- | --- |
| Religião | christian_place_of_worship, buddhist_place_of_worship, hindu_place_of_worship, muslim_place_of_worship, religious_organization |
| Saúde | hospital, emergency_department, dental_clinic, behavioral_or_mental_health_clinic, specialized_health_care, specialized_medical_facility, health_care, medical_service, pediatric_clinic, vision_or_eye_care_clinic, primary_care_or_general_clinic |

- **Regra:** visita a lugar sensível nasce como “só eu” (seção 7.5). Para torná-la pública, o usuário precisa escolher isso explicitamente, uma visita por vez.
- **Exceção legítima:** uma catedral ou igreja histórica também é ponto turístico. O usuário pode publicar, mas o padrão protege.
- **Nas estatísticas públicas** (índice morador × visitante, perfil de viajante, retrospectiva), visitas a lugares sensíveis não entram, mesmo quando a visita é pública.

## D6. Lugares novos: criação e verificação

Não esperar a Overture: ela atualiza mensalmente e um lugar novo só entra depois que a fonte dele (quase sempre a página no Facebook) existe e é processada, o que pode levar meses. Se o registro falha porque o lugar “ainda não existe”, o usuário desiste, e o registro é o centro do produto. Princípio: **qualquer pessoa cria; a verificação depende de confiança.**

| Ação | Quem pode | Resultado |
| --- | --- | --- |
| Criar lugar ao registrar uma visita | Qualquer usuário (até 5 por dia, parâmetro) | Lugar “pendente”: visível para quem criou; para os outros, com o selo “não verificado” |
| Criar estando no local (GPS a até 100 m do ponto) | Qualquer usuário | Nasce verificado |
| Segunda pessoa registra visita no lugar pendente | Qualquer usuário | Lugar verificado |
| Criar ou verificar sozinho | Usuário de confiança: 10 ou mais lugares criados e confirmados, sem sinalizações procedentes (parâmetros) | Nasce verificado |
| Dar dica de lugar sem visita (“abriu um bar novo na minha rua”) | Só usuário de confiança | Lugar pendente, sem visita |

- **Por que não restringir a criação:** se só quem usa muito pudesse cadastrar, o usuário novo, justamente quem precisa ser retido, tropeçaria no primeiro lugar inexistente. O risco de spam está nas dicas sem visita, e é ali que fica a restrição.
- **Lugar que fechou e reabriu com outro negócio no mesmo endereço:** é um lugar novo. As visitas e notas do antigo pertencem ao negócio que fechou; herdar o registro misturaria dois negócios na mesma nota. Se o antigo ainda não estiver marcado como fechado, a criação do novo dispara a sinalização “fechou de vez” (D2).
- **Mesmo negócio reaberto** (fechou temporariamente e voltou): é o mesmo lugar; o status volta para “ativo”.
- **Reconciliação com a Overture:** quando a importação mensal trouxer um lugar que já foi criado por usuário, a regra D4 anexa o GERS (identificador global do Overture) ao lugar existente em vez de criar outro. Sem isso, cada lugar criado vira duplicata no mês seguinte.
- **Reconhecimento:** selo “primeiro a registrar este lugar”. Gamificação que gera dado útil, voltada à persona Explorador local. O selo só aparece para os outros se a visita que o gerou for pública (seção 9.3).


---
Parte do documento de visão do Lugora (v0.5.1). Índice: [README](../README.md).
