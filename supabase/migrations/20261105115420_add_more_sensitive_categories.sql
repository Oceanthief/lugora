-- Decisão do Victor, na segunda rodada da revisão de privacidade da Fatia 3 (ADR 0010). Estes tipos
-- também trazem serviços de saúde: nutricionistas e psicólogas, por exemplo, aparecem em wellness_service.
-- A visita nasce "só eu" (Fatia 4), e a pessoa ainda pode publicá-la. Nenhuma política de RLS muda.

insert into public.category_map (overture_category, category, category_group, is_visitable, is_sensitive) values
  ('wellness_service', 'health_care', 'health', false, true),
  ('senior_living_facility', 'health_care', 'health', false, true);
