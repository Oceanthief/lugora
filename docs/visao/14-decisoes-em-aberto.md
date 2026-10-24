# 14. Decisões em aberto

| Decisão | Opções | Recomendação | Quando |
| --- | --- | --- | --- |
| Nome do produto | Lugora (decidido) | Antes de usar publicamente: INPI (classes 9 e 42), domínio e @ nas redes | Antes da Fase 1 |
| Stack | Supabase + Next.js ou FastAPI + React | Supabase + Next.js | Antes da Fase 1 |
| Raio de deduplicação | 50 a 200 m | Importação: 50 m (D4). Criação no app: 150 m | Fase 1 |
| Corte de confiança | Cortar na importação ou só ordenar | Decidido: importar tudo e ordenar (D1) | — |
| Nível de usuário de confiança | 5 a 20 lugares confirmados | 10 (D6) | Fase 1 |
| Raio de verificação por GPS | 50 a 200 m | 100 m (D6) | Fase 1 |
| Limiar de fechamento | 1 a 3 sinalizações | 2 usuários diferentes (D2) | Fase 1 |
| Faixas do mapa | — | As da seção 7.4 | Fase 1 |
| Fonte dos limites de cidade | Overture ou IBGE | Decidido: Overture; IBGE para conferir no Brasil | — |
| Base dos números públicos | Todas as visitas ou só as públicas | Decidido: só as públicas (9.3). Revisar se faltar volume | Fase 3 |
| k mínimo para % de moradores | 3 a 10 pessoas por grupo | 5 (9.3) | Fase 3 |
| Resolução do mapa público | Cidade, H3 nível 7 ou 8 | H3 nível 7 (cerca de 5 km²) | Fase 2 |
| Cidade no exterior | Município ou região metropolitana | Município | Fase 1 |
| Encerramento automático de viagem | 1 a 7 dias sem registros fora | 3 dias | Fase 1 |
| Fotos por visita | 1 a 5 | 3 | Fase 1 |
| Lista de ocasiões | — | As 12 da seção 7.8, revisadas após a Fase 0 | Após a Fase 0 |
| Limiares do índice e da descoberta | — | Os da seção 7 como ponto de partida | Fase 3 |


---
Parte do documento de visão do Lugora (v0.5.1). Índice: [README](README.md).
