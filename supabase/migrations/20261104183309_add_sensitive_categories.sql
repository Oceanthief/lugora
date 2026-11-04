-- Decisão do Victor, na revisão de privacidade da Fatia 3 (ADR 0010). A lista da D5 deixava estes tipos
-- de fora. A visita a um lugar sensível nasce "só eu" (Fatia 4), e a pessoa ainda pode publicá-la.
-- Nenhuma política de RLS muda: quem está logado só lê esta tabela, e mudá-la exige uma migração.

alter table public.category_map drop constraint category_map_category_group_check;
alter table public.category_map add constraint category_map_category_group_check check (
  category_group in ('food_and_drink', 'culture', 'outdoors', 'sports', 'leisure_shopping', 'lodging', 'religion', 'health', 'other_sensitive')
);

insert into public.category_map (overture_category, category, category_group, is_visitable, is_sensitive) values
  -- A seção 9.1 cita serviços de saúde como dado sensível por inferência.
  ('diagnostics_imaging_or_lab_service', 'health_care', 'health', false, true),
  ('physical_medicine_and_rehabilitation', 'health_care', 'health', false, true),
  ('outpatient_care_facility', 'health_care', 'health', false, true),
  ('complementary_and_alternative_medicine', 'health_care', 'health', false, true),
  ('surgery', 'health_care', 'health', false, true),
  ('reproductive_perinatal_and_womens_care', 'health_care', 'health', false, true),
  ('emergency_or_urgent_care_facility', 'hospital', 'health', false, true),
  -- A LGPD (art. 5º, II) protege filiação a sindicato, opinião política, vida sexual e convicção religiosa.
  -- Estes não têm ícone nem nome na tela: aparecem só pelo nome do lugar.
  ('labor_union', 'labor_union', 'other_sensitive', false, true),
  ('political_organization', 'political_organization', 'other_sensitive', false, true),
  ('adult_entertainment_venue', 'adult_entertainment', 'other_sensitive', false, true),
  ('psychic_advising', 'psychic_advising', 'other_sensitive', false, true);
