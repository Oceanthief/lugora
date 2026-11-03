# Identidade visual do Lugora

**Direção escolhida:** C. Luz de poste (Fatia 1, novembro de 2026). A página de comparação `/estilos`, com as outras direções avaliadas (A, B e a mistura D), saiu do app e fica no histórico do git (`web/src/app/estilos/`).

**A ideia:** a cidade depois das seis. Fundo azul-noite no tema escuro, a luz âmbar dos postes em tudo o que você já viveu e controles em pílula que flutuam sobre o mapa.

**Tom pedido:** urbano, leve, sem muita informação disputando a atenção.

## Princípios

1. **O âmbar é a luz, não enfeite.** Ele aparece só na ação principal (botão, Registrar, aba ativa) e no que você já viveu (nota, ocasião escolhida, faixas do mapa).
2. **Uma coisa acesa por tela.** O brilho (`shadow-glow`) vai no que está "aceso", como o lugar visitado ou o botão central. O resto fica calmo.
3. **Pouca informação por vez.** Um cartão de visita mostra nome, categoria e cidade, nota, data e ocasião. Cada informação fica na sua linha ou na sua pílula, sem separadores como "·".
4. **Cantos generosos.** Os cartões têm cantos de 24 px; botões, ocasiões, abas e a barra inferior são pílulas.
5. **Nenhuma cor solta.** Só os tokens abaixo, pelas classes do Tailwind (`bg-canvas`, `text-ink`...). Um teste confere o contraste de todos eles.

## Onde estão os tokens

- **Fonte única:** [`web/src/lib/design-tokens.ts`](../../web/src/lib/design-tokens.ts). Para mudar uma cor, mude só ali.
- **CSS:** o layout injeta as variáveis `--lugora-*` (tema claro, tema escuro e `data-theme`).
- **Classes:** `web/src/app/globals.css` transforma as variáveis em classes do Tailwind.
- **Testes:** `npm test` confere o contraste (`design-tokens.test.ts`) e as faixas do mapa com daltonismo (`color-vision.ts`).
- **Tema:** segue o aparelho. Para forçar um tema num trecho da página, use `data-theme="light"` ou `data-theme="dark"`.

## Cores

| Token | Classe | Claro | Escuro | Uso |
| --- | --- | --- | --- | --- |
| `canvas` | `bg-canvas` | `#F4F5F8` (neblina) | `#131A25` (asfalto) | Fundo da tela |
| `surface` | `bg-surface` | `#FFFFFF` (calçada) | `#1C2635` (calçada à noite) | Cartões, barra inferior, campos |
| `ink` | `text-ink` | `#19212E` | `#F3EEE6` (branco quente) | Texto principal e ícones |
| `ink-muted` | `text-ink-muted` | `#4E5767` | `#AEB6C4` | Texto secundário: categoria, data, legenda |
| `accent` | `bg-accent`, `text-accent` | `#AC530A` (âmbar queimado) | `#F2A93B` (âmbar) | Ação principal, aba ativa, nota |
| `on-accent` | `text-on-accent` | `#FFFFFF` | `#1A1206` | Texto e ícone sobre o âmbar |
| `glow` | `bg-glow` | `#FBE7C8` | `#3A2E1C` | Ocasião escolhida, fundo do ícone aceso |
| `on-glow` | `text-on-glow` | `#19212E` | `#F6D9A8` | Texto sobre o `glow` |
| `line` | `border-line` | `#DCE0E7` | `#2B3647` | Contornos e divisórias |
| `danger` | `text-danger` | `#B42318` | `#FF8A7A` | Mensagens de erro do formulário |

### Contraste

Meta: 4,5:1 para texto (seção 13). Todos os pares passam e são testados.

| Par | Claro | Escuro |
| --- | --- | --- |
| Texto principal no fundo | 14,8:1 | 15,1:1 |
| Texto principal no cartão | 16,2:1 | 13,2:1 |
| Texto secundário no fundo | 6,7:1 | 8,6:1 |
| Texto secundário no cartão | 7,3:1 | 7,5:1 |
| Texto no botão principal | 5,3:1 | 9,3:1 |
| Texto na ocasião escolhida | 13,4:1 | 9,7:1 |
| Âmbar como texto no fundo | 4,8:1 | 8,7:1 |
| Âmbar como texto no cartão | 5,3:1 | 7,6:1 |
| Erro no fundo | 6,0:1 | 7,6:1 |
| Erro no cartão | 6,6:1 | 6,7:1 |

## Mapa

### Faixas de lugares distintos (seção 7.4)

| Token | Classe | Lugares na cidade | Claro | Escuro |
| --- | --- | --- | --- | --- |
| `level-1` | `bg-level-1` | 1 | `#F8E1B5` | `#4A3518` |
| `level-2` | `bg-level-2` | 2 a 5 | `#E8A647` | `#8A5A1C` |
| `level-3` | `bg-level-3` | 6 a 15 | `#C8771E` | `#D08A2C` |
| `level-4` | `bg-level-4` | 16 ou mais | `#7A4310` | `#F7C46A` |

- **Uma cor só, o âmbar, mudando de luminosidade.** No claro, mais lugares deixam a faixa mais escura; no escuro, mais clara. A faixa sempre "acende" contra o fundo.
- **Na legenda,** cada quadradinho tem contorno `line`, porque a faixa 1 do tema claro quase some no fundo.
- **Seguras para daltônicos:** cada faixa difere da vizinha em pelo menos 1,5:1, o que o teste garante. Menor diferença simulada, pelas matrizes de Machado e colegas (2009):

| Tema | Visão normal | Protanopia | Deuteranopia | Tritanopia | Acromatopsia |
| --- | --- | --- | --- | --- | --- |
| Claro | 1,6:1 | 1,7:1 | 1,6:1 | 1,6:1 | 1,6:1 |
| Escuro | 1,8:1 | 1,8:1 | 1,7:1 | 1,7:1 | 1,8:1 |

### Pontos no mapa

O mapa base (OpenFreeMap Liberty) é sempre claro. Por isso os pontos usam cores fixas, que não mudam com o tema do app: `mapColors` em `design-tokens.ts`.

| Peça | Cor | Contraste |
| --- | --- | --- |
| Ponto | `#AC530A` (âmbar do tema claro), contorno branco | Ícone branco sobre ele: 5,3:1 |
| Nota embaixo do ponto | `#19212E` com contorno branco | 16,2:1 |

## Tipografia

**Urbanist**, uma fonte geométrica e leve, em todos os textos (token `--font-sans`, classe `font-sans`). Ela é carregada pelo `next/font`: os arquivos vêm do próprio site, sem pedido ao Google.

| Papel | Classes | Tamanho |
| --- | --- | --- |
| Título da tela | `text-2xl font-semibold` | 24 px |
| Nome do lugar no cartão | `text-lg font-semibold` | 18 px |
| Texto corrido | `text-base` | 16 px |
| Secundário (categoria, data) | `text-sm text-ink-muted` | 14 px |
| Legenda, rótulo da barra | `text-xs` | 12 px |
| Nota | `text-sm font-semibold`, pílula `bg-accent text-on-accent` | 14 px |

Evite rótulos em caixa alta e realce de uma palavra só num título.

## Espaçamento, raios e sombra

- **Espaçamento:**
  - escala padrão de 4 px do Tailwind;
  - margem lateral das telas: `px-4` (16 px);
  - dentro do cartão: `p-4`;
  - entre cartões: `gap-3` (12 px).
- **Área de toque:** mínimo de 44 px (`min-h-11`, `size-11`), pela seção 13.
- **Raios:**
  - `rounded-card` (24 px): cartões;
  - `rounded-control` (pílula): botões, ocasiões, abas e a barra inferior;
  - `rounded-2xl` (16 px): o quadrado do ícone de categoria.
- **Sombra:** `shadow-glow`, a luz âmbar, só no que está "aceso". Não há outras sombras.

## Componentes

| Peça | Como é | Onde |
| --- | --- | --- |
| **Barra inferior** | Pílula `bg-surface` com contorno `line`, flutuando sobre o conteúdo. A aba ativa mostra ícone e nome em `bg-glow`; as outras, só o ícone (o nome fica para leitores de tela). O Registrar é o círculo `bg-accent` com `shadow-glow`: a única luz da tela. | `bottom-nav.tsx` |
| **Cartão** | `rounded-card bg-surface p-4`, sem contorno nem sombra. | Feed, Quero ir, Perfil |
| **Nota** | Pílula `bg-accent text-on-accent`; leitores de tela ouvem "Nota 4,5". | `rating-pill.tsx` |
| **Ícone de categoria** | Quadrado `rounded-2xl bg-glow text-accent`, sem brilho. | `category-icon.tsx` |
| **Botão principal** | Pílula `bg-accent text-on-accent`, pelo menos 48 px de altura. | Registrar, mapa vazio |
| **Ocasião e nota no formulário** | Pílulas com contorno `line`. Escolhida: a nota acende em `bg-accent`, a ocasião em `bg-glow`, e as duas ganham contorno `accent`, para não depender só da cor. | `visit-form.tsx` |
| **Balão do mapa** | Segue o tema do app: `rounded-card bg-surface text-ink`, contorno `line`, sem ponta. | `visit-map.tsx` |
| **Foco do teclado** | Contorno de 2 px em `accent`; nos pontos do mapa, em `mapColors.focus`. | Todos os controles |

A barra flutua, então toda tela reserva espaço embaixo (o `main` do layout já faz isso). O mapa é a exceção: ele ocupa a tela inteira, por baixo da barra.

**Texto do próprio mapa** (como a atribuição): usa a cor fixa `mapColors.labelText`, porque o mapa base é sempre claro. No tema escuro, o texto claro do app sumiria sobre ele.

## Exemplo

```tsx
<article className="rounded-card bg-surface p-4">
  <h3 className="text-lg font-semibold text-ink">Cervejaria Württemberg</h3>
  <p className="text-sm text-ink-muted">Cervejaria em Juiz de Fora</p>
  <span className="rounded-control bg-accent px-2.5 py-0.5 text-sm font-semibold text-on-accent">4,5</span>
</article>
```
