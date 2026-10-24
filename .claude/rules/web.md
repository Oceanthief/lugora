---
paths:
  - "web/**"
---

# Regras do app (web/)

- **Next.js atual:** siga o `web/AGENTS.md` gerado pelo create-next-app. Ele aponta a documentação da versão instalada; não confie em APIs antigas de memória.
- **Server Components por padrão.** Use `"use client"` só quando precisar de interação no navegador: mapa, formulários com estado, câmera, GPS.
- **Mobile-first:** desenhe primeiro para 390 px de largura. Áreas de toque com pelo menos 44 px. A navegação principal fica na barra inferior.
- **Acessibilidade** (seção 13 do documento): contraste mínimo de 4,5:1 para texto, rótulo em todo botão de ícone, texto alternativo nas fotos. O mapa sempre tem uma alternativa em lista.
- **Mapa:** MapLibre GL JS com o estilo `https://tiles.openfreemap.org/styles/liberty`. A atribuição fica sempre visível. Nada de Google Maps (termos de uso, seção 10).
- **Cores e tipografia:** use só os tokens de `docs/design/identidade.md` (a partir da Fatia 1). Nada de cor solta no componente.
- **Textos da interface** em português, centralizados em `web/src/content/pt-BR.ts`, para traduzir depois.
- **Dados:** acesse o Supabase com a sessão do usuário (`@supabase/ssr`), para o RLS valer. A chave `service_role` não existe neste app.
- **Datas:** mostre só a data da visita, no formato brasileiro (`23/10/2026`). Nunca a hora.
- **Testes:** use Vitest para a lógica (formatação, regras de publicação, cálculos). Telas importantes ganham teste de fluxo com Playwright a partir da Fatia 4.
- **Antes de dizer que uma tela está pronta:** suba o app, abra a página em 390 × 844 e em 1280 × 800 e mostre os prints. Use o MCP do Playwright, se estiver configurado.
