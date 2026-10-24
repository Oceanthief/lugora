---
paths:
  - "supabase/**"
---

# Regras do banco (supabase/)

- **Toda mudança de estrutura é uma migração:** `npx supabase migration new nome_curto`. Nunca edite uma migração já aplicada. Nunca mude o banco pelo Studio sem migração.
- **Nomes:** inglês, `snake_case`, tabelas no plural, conforme `docs/glossario.md`.
- **RLS em toda tabela do schema `public`**, com uma política por operação (`select`, `insert`, `update`, `delete`). Para cada política, um teste pgTAP em `supabase/tests/` cobrindo o dono e outro usuário. Os casos mínimos estão na seção 9.5 do documento.
- **Views expostas:** `create view ... with (security_invoker = true)`. Views materializadas e agregados ficam no schema `private`, que não é exposto pela API; leitura só por funções que aplicam as regras da seção 9.3.
- **Geografia:** lugares em `geography(Point, 4326)` com índice GiST. Limites de cidades e países em `geography(MultiPolygon, 4326)`.
- **Nota:** `numeric(2,1)` com check entre 0,5 e 5 e múltiplo de 0,5.
- **Datas:** `visited_on` é `date`, sem hora. `publish_at` e os carimbos de criação são `timestamptz`.
- **Parâmetros** (raios, limiares, faixas) ficam na tabela `app_parameters`, nunca fixos no código.
- **Seed** (`supabase/seed.sql`): só dados fictícios. Nunca pessoas reais nem dados da Fase 0 sem autorização.
- **Antes de terminar:** `npx supabase db reset` (o banco local recria do zero) e `npx supabase test db` precisam passar.
