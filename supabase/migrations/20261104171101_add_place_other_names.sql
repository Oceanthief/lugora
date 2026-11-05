-- Quem digita o nome certo sempre encontra o lugar (D1). Quando dois registros com nomes diferentes
-- são mesclados na revisão, o nome que não ficou continua valendo para a busca, sem aparecer na tela.
-- "Posto Rumo Certo" acha o "POSTO TOP CENTRO".

alter table public.places add column other_names text;

-- A coluna gerada não muda de valor nas linhas sem outros nomes. search_places continua igual,
-- porque já busca palavras dentro de search_name.
alter table public.places drop column search_name;
alter table public.places add column search_name text
  generated always as (private.normalize_search_text(name || ' ' || coalesce(other_names, ''))) stored;
