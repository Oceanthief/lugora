# 0006. Mapa: como o MapLibre entra no app

- **Status:** proposta
- **Data:** 2026-10-29

## Contexto

O ADR 0001 escolheu o MapLibre GL JS com o OpenFreeMap. Na Fatia 0, colocar o mapa no Next.js 16 trouxe quatro problemas práticos:

- A biblioteca tem cerca de 1 MB e só funciona no navegador (WebGL).
- A versão 6 desenha o mapa num Web Worker e procura o arquivo dele ao lado do próprio código. O Turbopack muda esse caminho, e o mapa ficava em branco.
- Pontos como elementos HTML ficam por cima do canvas e cobrem os nomes de ruas e bairros.
- Com `cacheComponents`, o Next esconde a tela ao trocar de aba e desmonta o mapa; ao voltar, ele reabria no ponto inicial.

As regras de acessibilidade (seção 13) pedem área de toque de 44 px, rótulo em todo botão e alternativa em lista.

## Opções consideradas

1. **Biblioteca de ponte (react-map-gl):** componentes React prontos. Contra: mais uma dependência, e não resolve o worker nem a ordem das camadas.
2. **Pontos como marcadores HTML:** simples, acessíveis e focáveis. Contra: ficam sempre por cima dos nomes do mapa.
3. **Pontos como camadas do próprio mapa:** ficam abaixo dos nomes. Contra: o canvas não tem foco de teclado nem rótulo para leitor de tela.
4. **Camadas para o desenho e marcadores invisíveis para a interação:** junta o melhor de 2 e 3.

## Decisão

- O MapLibre entra direto, num Client Component (`visit-map.tsx`), carregado com `import()` só quando o mapa aparece.
- O worker é copiado de `node_modules` para `public/` antes do `dev` e do `build` (`scripts/copy-maplibre-worker.mjs`, fora do git) e apontado com `setWorkerUrl`.
- Opção 4 para os pontos: bolinha, ícone da categoria e nota como camadas abaixo da primeira camada de texto do estilo; por cima, um botão invisível de 44 px por ponto, com rótulo, foco e balão.
- A câmera fica num `useRef` e é restaurada quando a tela volta a aparecer.

## Consequências

- Os nomes do mapa continuam legíveis, e o toque, o teclado e o leitor de tela funcionam. A lista para leitor de tela continua obrigatória.
- Com muitos pontos, um botão HTML por ponto pesa. Quando o número de pontos crescer (Fatias 4 e 6), trocar por agrupamento (*clusters*) ou por camadas clicáveis com navegação por lista.
- As cores dos pontos estão fixas em `map-config.ts`; na Fatia 1 passam a vir dos tokens.
- Atualizar o `maplibre-gl` exige conferir o script do worker. Se o Turbopack passar a publicar arquivos de pacotes como URL, o script pode sair.
- Detalhe do MapLibre: `addTo()` desliga o teclado de um balão ligado antes, então o balão é ligado depois.
