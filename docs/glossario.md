# Glossário: documento → código

O documento de visão usa nomes em português. O código e o banco usam inglês (ADR 0003). Esta tabela é a ponte entre os dois: siga estes nomes, e quando surgir um conceito novo, adicione aqui antes de criar a tabela ou o tipo.

## Tabelas

| Documento | Tabela | Observação |
| --- | --- | --- |
| Usuário | `profiles` | 1 para 1 com `auth.users` (Supabase Auth); só campos que outros podem ver |
| Usuário (dados privados) | `profiles_private` | cidade de residência e configurações; só o dono lê (o RLS protege linhas, não colunas) |
| Consentimento | `consents` | um registro por finalidade e versão da política |
| País | `countries` | |
| Cidade | `cities` | pontos para o mapa; polígono quando necessário |
| Lugar | `places` | |
| Visita | `visits` | o coração do produto |
| Foto | `photos` | sem metadados |
| Tag / VisitaTag | `tags` / `visit_tags` | ocasiões, temas e atributos |
| CidadeMarcada | `marked_cities` | "já estive", sem lugar |
| Viagem / ViagemParticipante | `trips` / `trip_members` | |
| Lista / ItemLista | `lists` / `list_items` | "Quero ir" e curadoria |
| Seguir | `follows` | |
| Convite | `invites` | |
| Denúncia | `content_reports` | moderação de conteúdo |
| Sinalização | `place_flags` | "fechou", "categoria errada" etc. (D2) |
| CategoriaMapa | `category_map` | D3 e D5 |
| ImportacaoOverture | `overture_imports` | uma linha por atualização |
| Evento | `events` | métricas do produto |
| Parâmetro | `app_parameters` | limiares configuráveis |

## Campos principais

| Documento | Código | Valores |
| --- | --- | --- |
| cidade_residencia_id | `home_city_id` | privado, em `profiles_private` |
| confirmou_18_em | `age_confirmed_at` | |
| visibilidade_padrao | `default_visibility` | |
| mostrar_cidade (9.3) | `show_home_city` | padrão `false` |
| mostrar_sequencia | `show_streak` | |
| nivel_confianca | `trust_level` | derivado (D6) |
| finalidade / versao_politica / aceito | `purpose` / `policy_version` / `granted` | `essential`, `precise_location`, `emails`, `analytics` |
| nome (usuário) | `name` | 1 a 80 caracteres |
| username | `username` | o @: 3 a 30 caracteres, com minúsculas, números e `_` |
| codigo_iso | `iso_code` | duas letras maiúsculas (`BR`); territórios em disputa usam `X?` do Overture (ADR 0008) |
| geometria (país, cidade) | `boundary` | `geography(MultiPolygon, 4326)` |
| fonte (cidade) | `source` | `overture` |
| chave / valor / descricao (parâmetro) | `key` / `value` / `description` | `value` em `jsonb` |
| ponto | `location` | `geography(Point, 4326)` |
| categoria_overture | `overture_category` | |
| categoria_lugora | `category` | veja "Categorias de lugar"; `residential` vem da limpeza pelo nome (D3) |
| grupo (categoria) | `category_group` | `food_and_drink`, `culture`, `outdoors`, `sports`, `leisure_shopping`, `lodging`, `religion`, `health` |
| nome normalizado | `search_name` | sem acentos, em minúsculas e sem pontuação; gerado a partir de `name` |
| executada_em | `ran_at` | em `overture_imports` |
| adicionados / removidos / alterados / reconciliados / sinalizados | `added` / `removed` / `changed` / `reconciled` / `flagged` | em `overture_imports` |
| mesclados / em revisão / não visitáveis | `merged` / `in_review` / `not_visitable` | em `overture_imports`; fora da tabela da seção 8, para a prova de cada importação |
| categoria_corrigida | `category_override` | tem prioridade (D3) |
| confianca | `confidence` | 0 a 1 |
| fontes | `sources` | |
| id_externo / ids_externos | `gers_id` / `merged_gers_ids` | GERS do Overture; em `cities`, é o `division_id` da divisão |
| endereco | `address` | |
| cep | `postal_code` | fora da tabela da seção 8; incluído por decisão do Victor (importação de JF, 2026-11) |
| estado_regiao (cidade) | `state` | UF no Brasil |
| status (lugar) | `status` | `active`, `pending`, `closed`, `merged` |
| mesclado_em_id | `merged_into_id` | |
| verificado / verificado_por | `is_verified` / `verified_by` | `gps`, `second_visit`, `trusted_user`, `import` |
| origem_criacao | `origin` | `overture`, `user` |
| data_visita | `visited_on` | `date`, sem hora |
| nota | `rating` | 0,5 a 5, passo 0,5 |
| comentario | `comment` | |
| eh_morador | `is_resident` | gravado no momento da visita |
| visibilidade | `visibility` | `public`, `followers`, `private` ("só eu") |
| publicar_em | `publish_at` | |
| verificada (visita) | `is_location_verified` | |
| status (visita) | `completeness` | `quick`, `complete` |
| mostrar_na_galeria | `show_in_gallery` | consentimento por foto (7.7) |
| texto_alternativo | `alt_text` | |
| tipo (tag) | `kind` | `occasion`, `theme`, `attribute` |
| tipo (lista) | `kind` | `want_to_go`, `curated` |
| link_origem | `source_url` | "onde eu vi" |
| seguidor_id / seguido_id | `follower_id` / `followee_id` | |
| usuario_id | `user_id` | dono da visita, da lista etc. |
| tipo (sinalização) | `kind` | `closed_permanently`, `closed_temporarily`, `moved`, `wrong_category`, `duplicate`, `not_exists` |
| visitavel / sensivel | `is_visitable` / `is_sensitive` | |

## Eventos (seção 12)

| Documento | Código |
| --- | --- |
| cadastro_concluido | `signup_completed` |
| visita_registrada | `visit_created` |
| visita_completada | `visit_completed` |
| foto_adicionada | `photo_added` |
| cidade_marcada | `city_marked` |
| lugar_criado / lugar_verificado / lugar_mesclado | `place_created` / `place_verified` / `place_merged` |
| mapa_visualizado / mapa_compartilhado | `map_viewed` / `map_shared` |
| quero_ir_adicionado | `want_to_go_added` |
| lugar_sinalizado / categoria_corrigida | `place_flagged` / `category_corrected` |
| galeria_visualizada / foto_denunciada | `gallery_viewed` / `photo_reported` |
| seguiu_usuario | `user_followed` |
| convite_enviado / convite_aceito | `invite_sent` / `invite_accepted` |

## Categorias de lugar

Lista única em `web/src/lib/categories.ts`; ícones em `web/src/lib/category-icons.ts`. O grupo segue a D3 (seção 7.2).

| Interface | Código | Grupo (D3) |
| --- | --- | --- |
| Café | `cafe` | Comer e beber |
| Bar | `bar` | Comer e beber |
| Restaurante | `restaurant` | Comer e beber |
| Padaria | `bakery` | Comer e beber |
| Sorveteria | `ice_cream` | Comer e beber |
| Pizzaria | `pizzeria` | Comer e beber |
| Hamburgueria | `burger` | Comer e beber |
| Cervejaria | `brewery` | Comer e beber |
| Doceria | `dessert_shop` | Comer e beber |
| Livraria | `bookstore` | Passeio e compras |
| Museu | `museum` | Cultura |
| Centro cultural | `cultural_center` | Cultura |
| Cinema | `cinema` | Cultura |
| Parque | `park` | Ar livre |
| Lanchonete | `casual_eatery` | Comer e beber |
| Fast food | `fast_food` | Comer e beber |
| Casa de sucos | `juice_bar` | Comer e beber |
| Galeria de arte | `art_gallery` | Cultura |
| Biblioteca | `library` | Cultura |
| Teatro | `theater` | Cultura |
| Monumento | `monument` | Cultura |
| Local histórico | `historic_site` | Cultura |
| Praça | `plaza` | Ar livre |
| Jardim | `garden` | Ar livre |
| Reserva natural | `nature_reserve` | Ar livre |
| Cachoeira | `waterfall` | Ar livre |
| Lago | `lake` | Ar livre |
| Zoológico | `zoo` | Ar livre |
| Pista de skate | `skate_park` | Ar livre |
| Parque para cães | `dog_park` | Ar livre |
| Estádio | `stadium` | Esporte |
| Academia | `gym` | Esporte |
| Estúdio de ginástica | `fitness_studio` | Esporte |
| Espaço esportivo | `sports_facility` | Esporte |
| Piscina | `swimming_pool` | Esporte |
| Shopping | `shopping_mall` | Passeio e compras |
| Artesanato e hobby | `craft_store` | Passeio e compras |
| Parque de diversões | `amusement_park` | Passeio e compras |
| Hotel | `hotel` | Hospedagem |
| Hospedagem | `lodging` | Hospedagem |
| Local de culto | `place_of_worship` | Religião (sensível, D5) |
| Organização religiosa | `religious_organization` | Religião (sensível, D5) |
| Hospital | `hospital` | Saúde (sensível, D5) |
| Dentista | `dental_clinic` | Saúde (sensível, D5) |
| Saúde | `health_care` | Saúde (sensível, D5) |
| Residencial | `residential` | Nenhum: não visitável (D3) |

## Rotas do app (português, porque são interface)

`/mapa` · `/feed` · `/registrar` · `/quero-ir` · `/perfil` · `/perfil/[username]` · `/lugar/[id]` · `/configuracoes` · `/entrar` · `/cadastro` · `/privacidade` · `/sobre` · `/estilos` (temporária, Fatia 1)

## Termos da interface

Visita · Lugar · Quero ir · Minha cidade · Viagens · Só eu · Seguidores · Pública · Já estive · Não verificado · Fechado
