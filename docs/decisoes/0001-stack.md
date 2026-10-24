# 0001. Stack: PWA em Next.js, Supabase e MapLibre

- **Status:** proposta (aceitar ou mudar antes da Fatia 0)
- **Data:** 2026-10-23

## Contexto

Projeto solo, construído com Claude Code, por alguém que domina Python e SQL e está aprendendo desenvolvimento web. O app precisa rodar no celular (câmera, GPS, instalação na tela inicial), ter login, regras de acesso por usuário, consultas geográficas e um mapa. O maior risco do projeto é não terminar (seção 1 do documento).

## Opções consideradas

1. **Next.js (React, TypeScript) + Supabase (PostgreSQL + PostGIS, Auth, Storage):** login pronto, regras de acesso no próprio banco (RLS), SQL como linguagem central, um único código para celular e computador. Contra: TypeScript e React são novos para o Victor; o PWA tem limites no iPhone (seção 10).
2. **FastAPI (Python) + React + PostgreSQL próprio:** backend em Python, que o Victor já conhece, e mais peso para vagas de backend. Contra: mais peças para construir e manter (autenticação, armazenamento, deploy), mais tempo até o primeiro usuário.
3. **App nativo (React Native ou Flutter):** melhor integração com o celular. Contra: lojas de apps, dois builds, ciclo de entrega lento para um MVP.

## Decisão

Opção 1. O MapLibre GL JS com os mapas do OpenFreeMap completa a stack: código aberto, sem chave de API e sem limite de visualizações.

## Consequências

- A lógica de dados fica em SQL (migrações, RLS, funções), o ponto forte do Victor. A interface em TypeScript será aprendida aos poucos, com a skill `explicar`.
- O banco local exige Docker Desktop (Fatia 2).
- Os planos gratuitos (Supabase, Vercel) atendem o beta. O Supabase gratuito pausa projetos após 7 dias sem uso.
- Se o PWA não bastar no iPhone (compartilhamento a partir de outros apps, notificações), dá para empacotar como app nativo depois, com Capacitor, sem reescrever.
- Revisar se o objetivo do portfólio mudar para destacar backend em Python.
