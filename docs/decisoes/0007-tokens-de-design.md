# 0007. Tokens de design: fonte única em TypeScript

- **Status:** proposta
- **Data:** 2026-11-03

## Contexto

A Fatia 1 transforma a direção visual escolhida (C, "Luz de poste") em tokens: cores dos temas claro e escuro, fonte, raios e sombra. As cores precisam chegar a quatro lugares:

1. **Ao CSS**, como classes do Tailwind (`bg-canvas`, `text-ink`...).
2. **Ao mapa:** o MapLibre pinta num canvas, não entende classes e precisa do valor em hex.
3. **Aos testes:** o contraste de 4,5:1 (seção 13) e as faixas do mapa seguras para daltônicos (seção 7.4).
4. **À documentação** (`docs/design/identidade.md`).

Escrever a mesma cor em mais de um lugar convida ao erro: um valor muda e o outro fica para trás.

## Opções consideradas

1. **Tokens só no CSS (`@theme` do Tailwind).**
   - A favor: é o caminho padrão do Tailwind.
   - Contra: o mapa teria de ler as cores com `getComputedStyle`, os testes de contraste teriam de ler o CSS como texto, e o tema escuro precisaria repetir os valores (uma vez para o aparelho, outra para `data-theme`).
2. **Tokens em TypeScript, com um script que gera o CSS.**
   - A favor: fonte única.
   - Contra: um passo a mais para lembrar de rodar e um arquivo gerado no git.
3. **Tokens em TypeScript, com o CSS gerado na hora pelo layout.**
   - A favor: fonte única, sem script; o mapa e os testes importam os valores direto.
   - Contra: um `<style>` pequeno vai no HTML de cada página.

## Decisão

Opção 3.

- **Fonte:** `web/src/lib/design-tokens.ts` guarda os valores, e `tokensCss()` gera as variáveis `--lugora-*` para o tema claro, o escuro (pelo aparelho) e `data-theme`. O layout injeta esse CSS.
- **Classes:** `globals.css` liga cada variável a uma classe com `@theme inline`. O `inline` faz a classe ler a variável no próprio elemento, e é isso que permite forçar um tema num trecho com `data-theme`.
- **Mapa:** os pontos, os nomes, os créditos e o contorno de foco usam cores fixas (`mapColors`), porque o mapa base é sempre claro, seja qual for o tema do app.

## Consequências

- **Mudar uma cor é mudar uma linha.** Os testes de contraste e de daltonismo rodam no `npm test` e acusam se a mudança quebrar a meta.
- **Uma classe por variável em `globals.css`.** Um teste confere que nenhum token fica sem classe.
- **Cor solta não passa.** O teste `design-tokens-usage.test.ts` lê `web/src` e falha com hexadecimal, `rgb`/`hsl`/`oklch`, classe da paleta do Tailwind (`zinc-600`, `bg-white`) ou variante `dark:` fora de `design-tokens.ts`. O tema escuro vem só das variáveis.
- **Custo pequeno:** o `<style>` com as cores tem cerca de 1 KB por página.
- **Tema escuro no mapa:** se o mapa ganhar um estilo escuro, `mapColors` passa a ter versão clara e escura.
- **Quando revisar:** se o projeto adotar uma ferramenta de design com exportação de tokens (como o Figma), vale considerar gerar `design-tokens.ts` a partir dela.
