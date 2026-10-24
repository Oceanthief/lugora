# 11. Fase 0: plano do teste concierge

MVP concierge: você faz à mão o que o app vai automatizar, para descobrir se as pessoas querem aquilo antes de gastar meses construindo. Duração: 3 a 4 semanas.

## 11.1 Hipóteses

| Hipótese | Como medir |
| --- | --- |
| As pessoas registram lugares sem ser cobradas | Registros nas semanas 3 e 4 sem lembrete individual |
| O mapa empolga | Reações e compartilhamentos espontâneos do mapa |
| O uso local gera frequência | Proporção local × viagem e regularidade semanal |
| Foto e comentário saem naturalmente | % de registros com foto e com comentário (ambos opcionais) |
| A indicação acontece | Pessoas que chamaram outra pessoa por conta própria |

## 11.2 Participantes

| Grupo | Perfil | Pessoas |
| --- | --- | --- |
| Colecionadores | Já registram filmes, treinos ou livros | 6 |
| Especialistas locais | Conhecem Juiz de Fora a fundo | 6 |
| Viajantes frequentes | Viajam várias vezes por ano | 5 |
| Planejadores | Montam roteiro e listas antes de sair | 5 |
| Casuais | Não registram nada hoje (grupo de controle) | 4 |

Total: 26 pessoas. Dentro de cada grupo, as pessoas se conhecem, o que permite observar o lado social.

## 11.3 Ferramentas e formulários

- **Cadastro único:** nome, cidade onde mora, cidades e países já visitados e autorização de uso dos dados.
- **Registro:** lugar + link do Google Maps; cidade e país (digitados de propósito, para você ver na prática o problema de “SP” × “São Paulo”); data; nota (0,5 a 5); viagem ou minha cidade; ocasiões da lista fixa; foto e comentário opcionais.
- **Mapa semanal:** um script Python (por exemplo, com folium) gera o mapa de cada pessoa a partir da planilha.

## 11.4 Ritual semanal

- Mesmo dia e mesma mensagem para todos, com o mapa de cada um.
- Não cobrar ninguém individualmente: a cobrança contamina a métrica de retenção.
- Anotar reações espontâneas (respostas, prints, compartilhamentos).

## 11.5 Roteiro de entrevista (The Mom Test)

Princípios do livro de Rob Fitzpatrick: fale da vida da pessoa, não da sua ideia; pergunte sobre fatos do passado, não sobre opiniões ou o futuro; escute mais do que fala.

**Antes do teste**

1. Me conta da última vez que você foi a um lugar novo na sua cidade. Como descobriu?
2. Na sua última viagem, como escolheu onde comer e o que visitar?
3. Você guarda lugares que quer conhecer? Onde? Pode me mostrar?
4. Quando alguém te pede indicação de lugar, o que você faz?
5. Você registra alguma coisa hoje (filmes, treinos, livros)? Desde quando? Ainda faz?

**Depois de 4 semanas**

1. Teve alguma vez que você pensou em registrar e não registrou? O que aconteceu?
2. O que você fez com o mapa que recebeu?
3. Você comentou do teste com alguém? O que disse?

**Evite:** “Você usaria?”, “Gostou da ideia?”, “Pagaria por isso?”. Elas geram respostas educadas e sem valor.

## 11.6 Critérios de sucesso (definidos antes de começar)

| Métrica | Definição | Meta sugerida |
| --- | --- | --- |
| Ativação | % que registra 3 ou mais lugares na primeira semana | 60% ou mais |
| Retenção | % que registra algo na semana 3 ou 4 sem cobrança | 33% ou mais |
| Espontaneidade | Pessoas que compartilharam o mapa ou chamaram alguém | 3 ou mais |
| Qualidade | % com foto, % com comentário, % local | Medir, sem meta |

> **Regra de decisão**
>
> Se a retenção ficar abaixo da meta, revise o produto (o que se registra, como e por quê) antes de investir mais no código. Ajuste as metas antes de começar, nunca depois de ver os números.


---
Parte do documento de visão do Lugora (v0.5.1). Índice: [README](README.md).
