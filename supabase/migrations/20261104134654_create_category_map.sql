-- Correspondência entre as categorias do Overture e as do Lugora (D3 e D5 da seção 7.2).
-- Tipo do Overture que não está aqui fica sem categoria do Lugora e não é visitável, mas o lugar
-- continua sendo encontrado pelo nome (D3). A lista é revista depois da Fase 0.

create table public.category_map (
  overture_category text primary key,
  category text not null,
  category_group text not null check (
    category_group in ('food_and_drink', 'culture', 'outdoors', 'sports', 'leisure_shopping', 'lodging', 'religion', 'health')
  ),
  is_visitable boolean not null,
  is_sensitive boolean not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger category_map_set_updated_at
  before update on public.category_map
  for each row execute function extensions.moddatetime(updated_at);

alter table public.category_map enable row level security;

-- Quem está logado lê: a tela vai precisar disto na Fatia 5, para corrigir categorias.
-- Mudar a tabela exige uma migração nova, porque ela é mantida pelo projeto.
create policy category_map_select_authenticated on public.category_map
  for select to authenticated
  using (true);

revoke all on table public.category_map from anon, authenticated;
grant select on table public.category_map to authenticated;

insert into public.category_map (overture_category, category, category_group, is_visitable, is_sensitive) values
  -- D3: comer e beber
  ('restaurant', 'restaurant', 'food_and_drink', true, false),
  ('casual_eatery', 'casual_eatery', 'food_and_drink', true, false),
  ('fast_food_restaurant', 'fast_food', 'food_and_drink', true, false),
  ('bar', 'bar', 'food_and_drink', true, false),
  ('cafe', 'cafe', 'food_and_drink', true, false),
  ('bakery', 'bakery', 'food_and_drink', true, false),
  ('smoothie_juice_bar', 'juice_bar', 'food_and_drink', true, false),
  -- D3: cultura
  ('museum', 'museum', 'culture', true, false),
  ('art_gallery', 'art_gallery', 'culture', true, false),
  ('library', 'library', 'culture', true, false),
  ('movie_theater', 'cinema', 'culture', true, false),
  ('theatre_venue', 'theater', 'culture', true, false),
  ('performing_arts_venue', 'theater', 'culture', true, false),
  ('arts_and_entertainment', 'cultural_center', 'culture', true, false),
  ('monument', 'monument', 'culture', true, false),
  ('historic_site', 'historic_site', 'culture', true, false),
  -- D3: ar livre
  ('park', 'park', 'outdoors', true, false),
  ('public_plaza', 'plaza', 'outdoors', true, false),
  ('garden', 'garden', 'outdoors', true, false),
  ('nature_reserve', 'nature_reserve', 'outdoors', true, false),
  ('waterfall', 'waterfall', 'outdoors', true, false),
  ('lake', 'lake', 'outdoors', true, false),
  ('zoo', 'zoo', 'outdoors', true, false),
  ('skate_park', 'skate_park', 'outdoors', true, false),
  ('dog_park', 'dog_park', 'outdoors', true, false),
  -- D3: esporte
  ('stadium_arena', 'stadium', 'sports', true, false),
  ('gym', 'gym', 'sports', true, false),
  ('fitness_studio', 'fitness_studio', 'sports', true, false),
  ('sport_or_fitness_facility', 'sports_facility', 'sports', true, false),
  ('swimming_pool', 'swimming_pool', 'sports', true, false),
  -- D3: passeio e compras
  ('shopping_mall', 'shopping_mall', 'leisure_shopping', true, false),
  ('books_music_and_video_store', 'bookstore', 'leisure_shopping', true, false),
  ('arts_crafts_and_hobby_store', 'craft_store', 'leisure_shopping', true, false),
  ('amusement_park', 'amusement_park', 'leisure_shopping', true, false),
  -- D3: hospedagem
  ('hotel', 'hotel', 'lodging', true, false),
  ('lodging', 'lodging', 'lodging', true, false),
  -- D5: religião. A visita nasce "só eu" (Fatia 4), e o lugar não entra em sugestões.
  ('christian_place_of_worship', 'place_of_worship', 'religion', false, true),
  ('buddhist_place_of_worship', 'place_of_worship', 'religion', false, true),
  ('hindu_place_of_worship', 'place_of_worship', 'religion', false, true),
  ('muslim_place_of_worship', 'place_of_worship', 'religion', false, true),
  ('religious_organization', 'religious_organization', 'religion', false, true),
  -- D5: saúde
  ('hospital', 'hospital', 'health', false, true),
  ('emergency_department', 'hospital', 'health', false, true),
  ('dental_clinic', 'dental_clinic', 'health', false, true),
  ('behavioral_or_mental_health_clinic', 'health_care', 'health', false, true),
  ('specialized_health_care', 'health_care', 'health', false, true),
  ('specialized_medical_facility', 'health_care', 'health', false, true),
  ('health_care', 'health_care', 'health', false, true),
  ('medical_service', 'health_care', 'health', false, true),
  ('pediatric_clinic', 'health_care', 'health', false, true),
  ('vision_or_eye_care_clinic', 'health_care', 'health', false, true),
  ('primary_care_or_general_clinic', 'health_care', 'health', false, true);
