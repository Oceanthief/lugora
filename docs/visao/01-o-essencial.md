# 1. O essencial

- **O que é:** Um app (site instalável no celular) para registrar lugares visitados, em viagem ou na própria cidade, avaliá-los e ver o mapa pessoal se preencher.
- **Decisão central:** Diário + mapa primeiro; descoberta depois. Os dados são modelados desde o primeiro dia para alimentar a descoberta.
- **Diferencial:** Índice morador × visitante e perfil de viajante, calculados a partir dos dados, não declarados pelo usuário.
- **Público:** Adultos (18+), segmentados por comportamento, não por geração.
- **Lançamento:** Fase 0 (teste concierge com 20 a 30 pessoas em Juiz de Fora) → beta fechado → crescimento por convites → descoberta liberada por cidade quando houver densidade de dados.
- **Stack sugerida:** PWA em Next.js + Supabase (PostgreSQL com PostGIS) + MapLibre; base de lugares da Overture Maps; Python e DuckDB na camada de dados.
- **Base de lugares:** Overture Maps: 19.459 lugares em Juiz de Fora, cobertura ótima e qualidade irregular. É a base, não a fonte de verdade (seção 7.2).
- **Maior risco:** Não terminar. Por isso: escopo enxuto, fases com critério de avanço e uma funcionalidade completa por vez.


---
Parte do documento de visão do Lugora (v0.5.1). Índice: [README](README.md).
