-- Lugares fictícios para os testes de fluxo (Playwright, em web/e2e). A CI não carrega a base do
-- pipeline, então os testes registram visitas nestes. Todos ficam em Juiz de Fora, a cidade do seed.
-- Pode rodar quantas vezes quiser: o gers_id "e2e-..." impede repetir. O teardown dos testes não os
-- apaga, porque as visitas de outras rodadas podem apontar para eles; um db reset os tira.

insert into public.places (name, location, address, city_id, category, is_visitable, is_sensitive, confidence, gers_id)
select
  fixture.name,
  extensions.ST_SetSRID(extensions.ST_MakePoint(fixture.longitude, fixture.latitude), 4326)::extensions.geography,
  fixture.address,
  city.id,
  fixture.category,
  fixture.is_visitable,
  fixture.is_sensitive,
  0.9,
  fixture.gers_id
from (values
  ('Lanchonete Teste E2E', -43.3591, -21.7483, 'Rua dos Testes, 1', 'casual_eatery', true, false, 'e2e-lanchonete'),
  ('Padaria Teste E2E', -43.3503, -21.7625, 'Rua dos Testes, 2', 'bakery', true, false, 'e2e-padaria'),
  ('Hospital Teste E2E', -43.3625, -21.7822, 'Rua dos Testes, 3', 'hospital', false, true, 'e2e-hospital')
) as fixture (name, longitude, latitude, address, category, is_visitable, is_sensitive, gers_id)
join public.cities as city on city.gers_id = '8b275bf4-2525-4616-b815-f6c777ab419a'
on conflict (gers_id) do nothing;
