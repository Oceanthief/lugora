---
name: fatia
description: Inicia ou retoma uma fatia do roadmap do Lugora (planejar, implementar, testar e mostrar no localhost). Use quando o Victor pedir para começar, continuar ou planejar uma fatia.
argument-hint: "[número da fatia] [instruções extras]"
disable-model-invocation: true
---

Argumentos recebidos: $ARGUMENTS

- O primeiro item é o número da fatia em `docs/roadmap.md`. Sem número, pegue a fatia com status "em andamento"; se não houver, a próxima "a fazer".
- Todo texto depois do número são instruções extras do Victor para esta fatia. Siga-as, desde que não contradigam o roadmap, o documento de visão ou as regras inegociáveis do `CLAUDE.md`. Se contradisserem, aponte o conflito no plano e pergunte.

1. **Entenda.** Leia a fatia inteira no roadmap e só as seções do documento que ela cita em "Ler antes". Se ela depender de uma fatia anterior que não está concluída, avise e pare.
2. **Branch.** Se não estiver numa branch `fatia/NN-...`, atualize a `main` e crie a branch.
3. **Planeje.** Mostre um plano curto:
   - arquivos que vai criar ou mudar;
   - dependências novas, cada uma com o motivo;
   - como vai testar cada critério de aceite;
   - o que o Victor vai ver no localhost ao final;
   - dúvidas que mudam o resultado.
   Espere a aprovação antes de editar qualquer arquivo. Mude o status da fatia para "em andamento".
4. **Implemente em passos pequenos.** Faça um commit a cada passo que funciona. Escreva os testes dos critérios de aceite junto com o código.
5. **Verifique.** Rode lint, typecheck, testes e build (e `npx supabase test db` se mexeu no banco). Corrija a causa de cada erro, sem silenciar regra nem teste.
6. **Mostre.** Suba o app e confira as telas da fatia em 390 × 844 e 1280 × 800. Mostre os prints e a saída dos testes.
7. **Atualize.** Marque no roadmap as tarefas concluídas. Se surgiu ideia fora do escopo, registre com a skill `ideia`.
8. **Encerre com:**
   - o que foi feito;
   - como conferir no localhost, passo a passo;
   - o que ficou para depois;
   - conceitos novos desta fatia, cada um em 2 ou 3 linhas simples.

Não marque a fatia como concluída: isso acontece em `/fechar-fatia`.
