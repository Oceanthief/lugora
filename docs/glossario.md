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
| finalidade / versao_politica / aceito | `purpose` / `policy_version` / `granted` | |
| ponto | `location` | `geography(Point, 4326)` |
| categoria_overture | `overture_category` | |
| categoria_lugora | `category` | |
| categoria_corrigida | `category_override` | tem prioridade (D3) |
| confianca | `confidence` | 0 a 1 |
| fontes | `sources` | |
| id_externo / ids_externos | `gers_id` / `merged_gers_ids` | GERS do Overture |
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

## Rotas do app (português, porque são interface)

`/mapa` · `/feed` · `/registrar` · `/quero-ir` · `/perfil` · `/perfil/[username]` · `/lugar/[id]` · `/configuracoes` · `/entrar` · `/cadastro` · `/sobre` · `/estilos` (temporária, Fatia 1)

## Termos da interface

Visita · Lugar · Quero ir · Minha cidade · Viagens · Só eu · Seguidores · Pública · Já estive · Não verificado · Fechado
