-- Busca de cidades do cadastro: acha "São Paulo" digitando "sao paulo".
-- Lê só dados públicos e devolve só id, nome e UF, nunca o polígono, que é pesado.

create extension if not exists unaccent with schema extensions;

create function public.search_cities(p_query text)
returns table (id uuid, name text, state text)
language sql
stable
security invoker
set search_path = ''
as $$
  with search as (
    -- Sem acentos, em minúsculas e com a pontuação virando espaço. Assim, "%" e "_" digitados
    -- não funcionam como curinga, e "embu guacu" acha "Embu-Guaçu".
    select btrim(regexp_replace(lower(extensions.unaccent(p_query)), '[^a-z0-9]+', ' ', 'g')) as term
  ),
  candidates as (
    select
      city.id,
      city.name,
      city.state,
      btrim(regexp_replace(lower(extensions.unaccent(city.name)), '[^a-z0-9]+', ' ', 'g')) as normalized
    from public.cities as city
  )
  select candidates.id, candidates.name, candidates.state
  from candidates
  cross join search
  where char_length(search.term) >= 2
    and strpos(candidates.normalized, search.term) > 0
  order by
    candidates.normalized = search.term desc,      -- primeiro, o nome exato
    starts_with(candidates.normalized, search.term) desc,  -- depois, quem começa com o termo
    candidates.normalized,
    candidates.state
  limit 10;
$$;

-- Só quem está logado usa o cadastro. Por padrão, o Postgres deixa qualquer um executar.
revoke execute on function public.search_cities(text) from public, anon;
grant execute on function public.search_cities(text) to authenticated;
