---
name: fechar-fatia
description: Fecha a fatia atual do Lugora. Confere a definição de pronto, revisa privacidade, atualiza a documentação e abre o pull request.
disable-model-invocation: true
---

1. **Definição de pronto.** Confira a seção "Definição de pronto" de `docs/roadmap.md` e os critérios de aceite da fatia atual. Se faltar algo, liste o que falta e pare.
2. **Qualidade.** Rode lint, typecheck, testes e build em `web/`. Se a fatia mexeu no banco, rode `npx supabase db reset` e `npx supabase test db`. Mostre a saída.
3. **Privacidade.** Se a fatia mexeu em banco, consultas, fotos, perfil, feed, galeria ou mapa, peça ao subagente `revisor-privacidade` para revisar o diff da branch contra a `main`. Corrija os achados que violam regras. Liste os demais para o Victor decidir.
4. **Documentação.**
   - No roadmap: marque as tarefas e mude o status da fatia para "concluída".
   - No `CLAUDE.md`: atualize se comandos, estrutura ou regras mudaram.
   - Houve decisão técnica nova sem ADR? Crie um, seguindo `docs/decisoes/0000-modelo.md`.
5. **Pull request.** Faça o commit final, envie a branch e abra o PR com `gh pr create`, preenchendo `.github/pull_request_template.md`.
6. **Resumo.** Explique em linguagem simples:
   - o que mudou;
   - como testar no localhost e no preview;
   - riscos ou pendências;
   - o próximo passo do roadmap.
