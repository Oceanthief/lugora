# 10. Arquitetura e stack

Princípio: poucas peças, bem documentadas, para quem constrói sozinho.

| Camada | Recomendação | Por quê | Alternativa |
| --- | --- | --- | --- |
| App | PWA em Next.js (React) | Instala no celular, um código só, acessa câmera e GPS | SvelteKit; app nativo depois, via Capacitor |
| Banco e backend | Supabase: PostgreSQL + PostGIS, Auth e Storage | Login pronto, regras de acesso no banco, consultas geográficas (“lugares a 100 m daqui”) | FastAPI (Python) + PostgreSQL próprio |
| Mapa | MapLibre GL JS + OpenFreeMap | Código aberto; sem chave e sem limite de visualizações | Outros provedores de tiles |
| Base de lugares | Overture Maps (+ Foursquare OS Places) | Aberta e gratuita; consultável com DuckDB | Google Places: pago e exige o mapa do Google |
| Camada de dados | Python + DuckDB na ingestão; tabela de eventos e views SQL; dashboard em Power BI ou Metabase | Mostra a camada de dados no portfólio | — |
| Fotos | Processamento no servidor (sharp ou Pillow) | Remover EXIF, gerar WebP e miniaturas | — |
| Hospedagem | Vercel (app) + Supabase | Planos gratuitos costumam atender um beta pequeno | — |

### Base de lugares: carga inicial

1. Baixar o recorte do município pelo limite oficial (tema divisions) com DuckDB. Feito para Juiz de Fora: 19.459 lugares (`relatorio_jf.py`).
2. Aplicar a `categoria_mapa` e as regras de limpeza (D3).
3. Deduplicar pela regra D4 e guardar os GERS mesclados.
4. Importar tudo, sem corte de confiança (D1). Contatos pessoais (e-mails) ficam fora.
5. Carregar no PostgreSQL com PostGIS.
6. Guardar um snapshot versionado: a Overture tira as versões do ar depois de cerca de 60 dias.

### Base de lugares: atualização mensal incremental

A cada versão, a Overture publica um changelog que marca cada lugar, pelo GERS, como adicionado, removido, alterado ou sem mudança. Em vez de recarregar tudo, o pipeline trata só o que mudou. É a técnica conhecida como CDC (*change data capture*, captura de mudanças).

| Tipo de mudança | O que significa | Ação no Lugora |
| --- | --- | --- |
| `added` | Lugar novo na base | Procurar par entre os lugares criados por usuários (regra D4). Se achar, anexar o GERS ao lugar existente (D6); se não, inserir |
| `removed` | Saiu da base: fechou, foi fundido ou mudou de ID | Tentar reencontrar por nome e distância (D4). Se achar, atualizar o GERS e guardar o antigo em `ids_externos`. Se não, conta como 1 sinalização “possivelmente fechado” (D2) |
| `data_changed` | Mudou a geometria ou algum atributo | Agir só se mudou uma coluna usada pelo Lugora (nome, categoria, posição, endereço, confiança), conferindo `columns_changed`. Correções feitas por usuários (D3) nunca são sobrescritas |
| `unchanged` | Nada mudou | Nada |

- **Idempotente:** rodar duas vezes a mesma versão dá o mesmo resultado, sem duplicar nem apagar nada. Assim, uma execução que falhou no meio pode ser repetida sem medo.
- **Auditoria:** cada execução grava uma linha em `ImportacaoOverture` (versão, data e quantos lugares foram adicionados, removidos, alterados, reconciliados e sinalizados). Vira também uma série histórica para o dashboard.

### Atribuição e licenças

| Dado | Licença | Onde creditar |
| --- | --- | --- |
| Mapa base (OpenFreeMap, com dados do OpenStreetMap) | ODbL (dados do OpenStreetMap) | No canto do mapa; o MapLibre adiciona automaticamente |
| Limites de cidades e países (Overture, tema divisions) | ODbL | “© OpenStreetMap contributors, Overture Maps Foundation” no mapa e na página Sobre |
| Lugares (Overture, tema places) | Por fonte: CDLA Permissive 2.0 (Meta, Microsoft e outras), Apache 2.0 (Foursquare), CC0 (AllThePlaces) | Página Sobre: “Dados de lugares: Overture Maps Foundation” e a lista de fontes. No repositório: os textos das licenças e o arquivo NOTICE da Foursquare |

Se um dia o projeto publicar uma base derivada desses dados (por exemplo, um dataset aberto no Kaggle), é preciso revisar as condições da ODbL, que exige compartilhar bases derivadas sob a mesma licença.

### Limitações do PWA no iPhone

- Notificações só funcionam com o app adicionado à tela inicial (iOS 16.4 ou superior).
- O app não aparece no menu de compartilhamento de outros apps.
- Não há aviso automático de instalação: o próprio app precisa ensinar a adicionar à tela inicial.

### Escolha da stack

Supabase + Next.js é a recomendação para terminar mais rápido e com menos risco de segurança. Se o objetivo do portfólio for mostrar backend, FastAPI conta mais, ao custo de mais tempo. Decisão em aberto (seção 14).


---
Parte do documento de visão do Lugora (v0.5.1). Índice: [README](README.md).
