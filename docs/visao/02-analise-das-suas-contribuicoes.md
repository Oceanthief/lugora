# 2. Análise das suas contribuições

Para cada ponto: o que você propôs, a avaliação e a decisão que entra no produto. Legenda: **Correto**   **Parcialmente correto**   **Precisa mudar**

## 2.1 Primeiros usuários e MVP concierge (seu ponto 1)

- **Sua proposta:** Selecionar 20 a 30 pessoas com perfis e estilos de vida diferentes, usar o The Mom Test no teste e codar o MVP concierge separadamente, seguindo os traços do projeto principal.
- **Avaliação:** **Parcialmente correto**

**O que está certo.** O tamanho do grupo e a diversidade de perfis ajudam a ver comportamentos diferentes. O *The Mom Test* é a referência certa para não se enganar com elogio de amigo.

**O que ajustar.**

- **Diversidade sem conexão deixa o feed vazio.** Se ninguém se conhece, cada pessoa usa o app sozinha e a parte social nunca é testada. Monte 4 a 5 grupos de perfis diferentes, com pessoas que se conhecem dentro de cada grupo: diversidade entre os grupos, conexão dentro deles.
- **Concentre em Juiz de Fora.** Densidade numa cidade vale mais do que registros espalhados.
- **Expectativa estatística.** 25 pessoas em 5 perfis dão cerca de 5 por perfil: suficiente para observar comportamento, insuficiente para concluir algo sobre cada perfil. Trate como pesquisa qualitativa com métricas simples.
- **Codar o concierge à parte contradiz o propósito.** Um MVP concierge existe para testar comportamento sem código, em dias. Um código separado vira um segundo projeto, atrasa o teste e faz as pessoas avaliarem telas e bugs em vez da ideia.

> **Decisão: duas trilhas em paralelo**
>
> - **Trilha A, comportamento (Fase 0):** formulário + planilha + mapa semanal gerado por você em Python. Começa em um fim de semana. Detalhes na seção 11.
> - **Trilha B, produto (Fase 1):** o app de verdade, começando pela primeira fatia vertical (registrar uma visita e vê-la no mapa), com o mesmo modelo de dados da Trilha A. Fatia vertical é uma funcionalidade completa, da tela ao banco, em vez de todas as telas primeiro.
> - Os registros da Fase 0 são importados no app. Nenhum código é jogado fora.

## 2.2 Uso local, busca por ocasião e sequência (seu ponto 2)

- **Sua proposta:** Não limitar a viagens: usar no dia a dia para achar lugares na própria cidade por ocasião (romântico, geek, esportes) e criar hábito de registro com sequência (streak).
- **Avaliação:** **Parcialmente correto**: a direção está certa, com três ajustes.

**O que está certo.** O uso local resolve o maior problema do produto, a frequência. Viagem acontece de 1 a 3 vezes por ano; sair na própria cidade, toda semana. E traz o morador, que é quem conhece os lugares que interessam.

- **Buscar por ocasião é descoberta.** É exatamente a parte que decidimos deixar para depois, porque só funciona com volume. Solução: capturar as ocasiões desde o v1 (um toque no registro) e liberar a busca por cidade quando houver densidade (seção 7.10).
- **Ocasiões em lista fixa, não texto livre.** Em texto livre, “romântico”, “romantico”, “date” e “casal” viram quatro coisas diferentes. Separe três dimensões: categoria (o que o lugar é, vem da base de lugares), ocasião (para que serve, o usuário marca) e atributos (preço, pet friendly). Um lugar só ganha uma etiqueta quando uma parcela mínima de quem avaliou marcou (seção 7.8).
- **Sequência semanal, não diária.** Ninguém vai a um lugar novo todo dia; uma sequência diária força registro falso e polui a base. Ela entra na Fase 2, depois de medir a retenção sem ela; senão você não sabe se as pessoas voltam pelo valor do app ou pela sequência. O Swarm, da Foursquare, já trabalhou com sequências semanais.

> **Decisão**
>
> - Uso local e viagem no mesmo app, com abas separadas no mapa.
> - Ocasiões em lista fixa, até 3 por visita, desde o v1. Busca por ocasião na Fase 3, cidade por cidade.
> - Sequência semanal com regra anti-trapaça, na Fase 2 (seção 7.9).

## 2.3 Vencer os três métodos e atender as gerações Z e Y (seu ponto 3)

- **Sua proposta:** Morador → índice local; checklist de vídeos → lista “Quero ir”; seguir viajantes → seguir + feed. Atender as gerações Z, Y e mais novas.
- **Avaliação:** **Correto, com uma exceção**: as “gerações mais novas”.

- **Menores de idade ficam de fora.** Abaixo da geração Z estão menores de 18 anos. Um app que registra localização de menores entra no escopo do ECA Digital (Lei 15.211/2025), em vigor desde 17 de março de 2026 e regulamentado pelo Decreto 12.880/2026, além do art. 14 da LGPD. A lei exige, entre outras medidas, proteção por padrão, supervisão parental e, em vários casos, verificação de idade confiável, sem autodeclaração. Para um projeto solo, isso é inviável e arriscado.
- **Segmente por comportamento, não por geração.** Duas pessoas de 25 anos podem usar o app de formas opostas. Geração serve como referência de linguagem; as personas da seção 4 são por comportamento.
- **Limite técnico do “Quero ir”.** O caminho natural seria compartilhar do TikTok ou do Instagram direto para o app. Num app web instalável (PWA), isso funciona no Android, mas o Safari do iPhone não aceita receber compartilhamentos (Web Share Target). No v1, o usuário cola o link e escolhe o lugar; o link fica salvo como “onde eu vi”. Se virar essencial, o app pode ser empacotado como nativo depois (por exemplo, com Capacitor).
- **Extrair o lugar do vídeo automaticamente** fica para depois: exige ler a legenda (ou usar IA) e esbarra nos termos de uso das redes.

> **Decisão**
>
> - Público 18+, com confirmação de idade no cadastro e revisão jurídica antes de abrir ao público.
> - Os três métodos viram três funcionalidades: índice morador × visitante (Fase 3), lista “Quero ir” com link de origem (Fase 1) e seguir + feed (Fase 1).

## 2.4 Morador × visitante e perfil de viajante (seu ponto 4)

- **Sua proposta:** Nota alta + 80% de avaliações de moradores → lugar de morador; 90% de turistas → ponto turístico (ou armadilha, “tem que ver isso”). Perfil “70% explorador, 30% clássico” e distinção entre quem viaja mais e quem descobre a própria cidade.
- **Avaliação:** **Correto**: é o diferencial do produto. Precisa de regras para não enganar.

- **Percentual de turistas não diz se o lugar é bom ou ruim.** A Torre Eiffel tem quase só visitantes e não é armadilha. O que separa ponto turístico de armadilha é a nota e, principalmente, a diferença entre a nota dos moradores e a dos visitantes.
- **Não rotule como “armadilha”.** É injusto com o negócio e arriscado juridicamente. Mostre o dado (“Moradores 3,1 · Visitantes 4,4”) e deixe o usuário concluir.
- **Amostra pequena engana.** Com 2 avaliações, um lugar é “100% morador”. Exija um mínimo de avaliadores por grupo e use média bayesiana: com poucas avaliações, a nota fica perto da média da cidade e só se afasta quando acumula evidência (fórmula na seção 7.11).
- **Morador é gravado no momento da visita.** A pessoa pode mudar de cidade depois; o campo `eh_morador` na visita preserva o contexto.
- **Sua distinção “viaja mais × descobre a própria cidade” é um segundo eixo.** O perfil fica com dois eixos: Onde (Viajante ↔ Local), calculável desde a Fase 1 só com os dados da própria pessoa, e Como (Clássico ↔ Explorador), que depende dos dados de todos e entra na Fase 3 (seção 7.12).

> **Decisão**
>
> - Índice e rótulos neutros na Fase 3, com mínimos de amostra e média bayesiana.
> - Perfil em dois eixos; o eixo Onde aparece já na Fase 1.

## 2.5 Ajustes de desenho (seu ponto 5)

- **Sua proposta:** Ajustar o desenho com as recomendações feitas.
- **Avaliação:** **Incorporado**: as mudanças viraram regras na seção 7.

| Item | Como era | Como fica |
| --- | --- | --- |
| Nota | Meia a 5 estrelas | Mantida, em passos de 0,5 |
| Foto e comentário | Obrigatórios | Opcionais e incentivados: registro rápido agora, completar depois |
| Cidade e país | Digitados | Derivados das coordenadas do lugar |
| Lugares repetidos | Identificados pelo endereço | Nome + distância + categoria, sobre uma base aberta de lugares |
| Mapa | Cor pelo número de avaliações | Duas camadas (visitado e lugares distintos), faixas de cor, abas Viagens e Minha cidade |
| Relação entre pessoas | Amigos | Seguir (unilateral) + perfil privado opcional |
| Avaliação | Uma por lugar | Várias visitas por lugar, cada uma com data e nota |

## 2.6 Riscos e suas respostas (seu ponto 6)

| Risco | Sua resposta | Avaliação | Decisão |
| --- | --- | --- | --- |
| Publicação em tempo real | Publicar no dia seguinte ou horas depois | **Parcial**. Bom padrão, mas insuficiente em viagem: dez dias de posts com 24 h de atraso ainda dizem “estou fora de casa”. | Minha cidade: 24 h depois. Viagem: ao encerrar a viagem. Opção “agora” com aviso. Exibir só a data, nunca a hora. |
| Metadados da foto (EXIF) | Remover os metadados ou subir a foto depois | **Precisa mudar**. Subir depois não resolve: as coordenadas ficam gravadas dentro do arquivo, não importa quando ele é enviado. Quem baixar a foto consegue lê-las. | Remoção obrigatória, sempre, no servidor. O app lê o EXIF antes, para uso interno (sugerir data e lugar, selo de visita verificada), e descarta. |
| LGPD | Pedir consentimento no cadastro ou na publicação | **Parcial**. Um “aceito” genérico não basta, e a LGPD vai além do consentimento. | Consentimento por finalidade, direitos do titular (exportar, corrigir, excluir de verdade), minimização de dados e política clara. Checklist na seção 9. |


---
Parte do documento de visão do Lugora (v0.5.1). Índice: [README](README.md).
