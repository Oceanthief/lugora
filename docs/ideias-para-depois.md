# Lugora · Ideias para depois

Ideias boas que ainda não têm evidência. Elas não entram no roadmap nem no documento de visão (`docs/visao/`) até passarem pela regra de promoção abaixo. O objetivo é proteger o escopo: o maior risco do projeto é não terminar.

No Claude Code, `/ideia descrição` registra uma ideia aqui sem implementar nada.

## Regra de promoção

Uma ideia sai daqui e vai para o roadmap (e, se mudar uma regra de produto, para o documento de visão) quando cumpre as três condições:

1. **Tem evidência:** resultado da Fase 0, dado de uso do app ou pedido espontâneo de mais de um usuário. Opinião de quem teve a ideia não conta.
2. **Tem lugar no plano:** dá para dizer em que fase ela entra e o que sai ou espera para ela caber.
3. **Tem métrica de sucesso definida antes de construir.**

Exceção: correções de risco (privacidade, segurança, dados errados) podem ir direto para o roadmap e o documento.

Se não der para escrever a hipótese de uma ideia, ela ainda não está madura para entrar aqui.

## Resumo

| # | Ideia | Status |
| --- | --- | --- |
| 1 | Registro offline em viagem | Aguardando a Fase 0 |
| 2 | Importar listas salvas do Google Maps | Aguardando a Fase 0 |

## Ideias

### 1. Registro offline em viagem

- **Data:** 23/10/2026
- **Ideia:** sem internet, o app guarda um rascunho no aparelho (ponto GPS, foto e nota). Quando a conexão volta, sugere o lugar ("Você esteve no Santiago Lanches?") e a pessoa confirma. Encaixa no princípio "registro rápido agora, completar depois".
- **Hipótese:** em viagem (roaming caro, sinal ruim), registros se perdem porque a busca de lugar precisa de internet, e isso derruba o uso justamente no caso de uso de viagem.
- **Como validar:**
  - Fase 0: na entrevista final, a pergunta "Teve alguma vez que você pensou em registrar e não registrou? O que aconteceu?" (seção 11.5 do documento de visão). Contar quantas respostas citam falta de internet, sem sugerir o motivo: perguntar direto sobre internet induziria a resposta.
  - Fase 1: medir registros iniciados e não concluídos, separando viagem de cidade de residência.
- **Custo e riscos:** é a parte mais difícil de um app web instalável. Exige fila local de envios, sincronização e tratamento de conflitos, e o iPhone limita o armazenamento de apps web.
- **Status:** aguardando a Fase 0.

### 2. Importar listas salvas do Google Maps

- **Data:** 23/10/2026
- **Ideia:** a pessoa exporta as próprias listas e lugares salvos pelo Google Takeout e importa no Lugora, alimentando a lista "Quero ir" e as cidades já visitadas.
- **Hipótese:** quem já mantém listas no Google Maps adota o Lugora mais rápido se não precisar recomeçar do zero. Ataca direto o "checklist" que as pessoas já mantêm (o segundo método da seção 3.1 do documento de visão).
- **Como validar:**
  - Fase 0: na pergunta 3 do roteiro ("Você guarda lugares que quer conhecer? Onde? Pode me mostrar?", seção 11.5), contar quantas pessoas usam o Google Maps para isso e quantos lugares têm salvos.
  - Antes de qualquer código: testar o formato da exportação com 2 ou 3 participantes.
- **Custo e riscos:** o formato da exportação pode mudar sem aviso. Cada item precisa ser casado com a base de lugares (regra D4). Usa só dados que a própria pessoa exportou, sem a API do Google.
- **Status:** aguardando a Fase 0.

## Como adicionar uma ideia

Copie o bloco abaixo, preencha e adicione uma linha no resumo.

```markdown
### N. Nome curto

- **Data:**
- **Ideia:**
- **Hipótese:**
- **Como validar:**
- **Custo e riscos:**
- **Status:** aguardando | em validação | promovida (v0.x) | arquivada
```

## Arquivadas

Ideias descartadas ficam aqui com o motivo, para a decisão não ser rediscutida do zero.

_Nenhuma por enquanto._
