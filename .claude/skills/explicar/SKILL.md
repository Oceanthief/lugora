---
name: explicar
description: Explica um arquivo, trecho de código ou as mudanças da branch para o Victor aprender, sem alterar nada.
argument-hint: "[arquivo, pasta ou 'diff']"
---

Explique "$ARGUMENTS" para um iniciante inteligente. Se o argumento for `diff` ou estiver vazio, explique `git diff main...HEAD`.

1. **Visão geral:** o que esse código faz e onde se encaixa no Lugora, em 3 a 5 linhas.
2. **Passo a passo:** os trechos principais, na ordem em que executam. Cite arquivo e linha.
3. **Por que assim:** a decisão por trás de cada escolha importante e pelo menos uma alternativa, com o motivo de não ter sido usada.
4. **Conceitos:** cada termo técnico novo explicado em 1 ou 2 linhas, com uma analogia quando ajudar.
5. **Riscos e melhorias:** o que pode dar errado, o que está frágil e o que você mudaria. Seja honesto: não valide por educação.
6. **Exercício:** uma pergunta ou pequena mudança para o Victor fazer sozinho e confirmar que entendeu.

Não edite arquivos.
