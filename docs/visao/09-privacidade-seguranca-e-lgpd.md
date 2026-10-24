# 9. Privacidade, segurança e LGPD

## 9.1 Checklist de LGPD

- **Finalidades separadas:** distinguir o essencial (o que o app precisa para funcionar) do opcional (localização precisa do celular, e-mails, uso de dados em análises). O opcional pede consentimento próprio, que pode ser retirado a qualquer momento.
- **Política de privacidade** em linguagem simples, com a versão registrada a cada aceite.
- **Direitos do titular:** ver e exportar os próprios dados, corrigir e excluir a conta de verdade, incluindo as fotos no armazenamento.
- **Minimização:** não guardar trilha de GPS nem metadados de fotos; só a ligação entre visita e lugar.
- **Dados sensíveis por inferência:** visitas a templos religiosos e serviços de saúde podem revelar religião e saúde, que a LGPD trata como dados sensíveis. Padrão: “só eu”.
- **Fase 0:** autorização simples por escrito dos participantes; anonimizar antes de usar qualquer dado ou print no portfólio.

_Este checklist é de engenharia de produto e não substitui orientação jurídica. Antes de abrir o app ao público, vale validar com um advogado._

## 9.2 Menores de idade

Público 18+, com confirmação de idade no cadastro. O ECA Digital (Lei 15.211/2025) está em vigor desde 17 de março de 2026 e é fiscalizado pela ANPD; as sanções vão de advertência a multa de até 10% do faturamento no Brasil, limitada a R$ 50 milhões por infração. Abrir o app para menores exigiria verificação de idade confiável, proteção por padrão e supervisão parental.

## 9.3 Privacidade nos números e mapas públicos

Cada visita está protegida, mas números e mapas somados podem revelar o que a pessoa escondeu. Regra geral: **um número mostrado a alguém só pode ser calculado com visitas que essa pessoa tem permissão de ver.**

| Onde | Risco | Regra |
| --- | --- | --- |
| Mapa do perfil público | O hexágono mais quente costuma ser o bairro onde a pessoa mora | Para os outros: cidades e países, ou hexágonos H3 de nível 7 (cerca de 5 km² cada). Detalhe fino só para o dono |
| Aba “Minha cidade” no perfil público | Revela a cidade de residência, que é privada | Para os outros, as abas viram um mapa só, sem rótulo. Mostrar a cidade é opção do usuário, desligada por padrão |
| Números do lugar (nota média, contagem, índice) | Uma visita “só eu” somada à média revela que alguém foi lá | Calculados só com visitas públicas |
| % de moradores do lugar | Revela a residência de quem avaliou: com 2 avaliações públicas, “100% moradores” diz onde essas pessoas moram | Exibir só com pelo menos 5 pessoas em cada grupo (k-anonimato: cada pessoa fica escondida num grupo de pelo menos k) |
| Perfil de viajante | Percentuais calculados com visitas privadas revelam hábitos escondidos | Para os outros, calculado só com o que eles podem ver; para o dono, com tudo |
| Selo “primeiro a registrar” | Revela uma visita “só eu” | Só aparece para os outros se a visita que gerou o selo for pública |
| Galeria do lugar | Expõe fotos não publicadas | Só fotos públicas, já publicadas e consentidas (seção 7.7) |

Custo: o índice morador × visitante passa a usar menos dados. Se faltar volume na Fase 3, a decisão pode ser revista (seção 14), mas nunca para incluir visitas “só eu” em números públicos.

## 9.4 Segurança técnica

- **Autenticação por provedor pronto** (por exemplo, Supabase Auth). Nunca implementar senha na mão.
- **Regras de acesso no banco** (Row Level Security, RLS): cada usuário só lê o que pode ver e só altera o que é dele, mesmo que alguém chame a API diretamente.
- **Views respeitam o RLS:** no Postgres, views ignoram as regras de acesso por padrão, porque rodam com as permissões de quem as criou. Toda view exposta pela API é criada com `WITH (security_invoker = true)` (Postgres 15 ou superior). Sem isso, uma view de feed ou de galeria expõe as visitas “só eu” de todo mundo.
- **Views materializadas e tabelas agregadas não têm RLS:** ficam num schema não exposto pela API e só são lidas por funções que aplicam as regras da seção 9.3.
- **Chave de serviço** (`service_role`, que ignora o RLS) só no servidor e nos scripts de importação. Nunca no app.
- **Uploads validados no servidor:** tipo, tamanho e processamento da imagem (seção 7.6).
- **Limite de requisições** contra spam e abuso.
- **Segredos fora do código:** chaves em variáveis de ambiente, nunca no repositório.

## 9.5 Testes de aceitação de privacidade e acesso

Cada regra vira um teste automatizado no formato Dado / Quando / Então, rodando a cada mudança (por exemplo, no GitHub Actions). Os testes são a especificação para o Claude Code: uma fatia só está pronta quando eles passam.

| # | Dado | Quando | Então |
| --- | --- | --- | --- |
| 1 | Uma visita “só eu” de A | B abre o feed, a galeria, o perfil de A ou a página do lugar | A visita não aparece em nenhum deles |
| 2 | A mesma visita | B consulta a API direto, com o próprio token, sem passar pelo app | A consulta não retorna a visita (testa RLS e views) |
| 3 | Uma visita “seguidores” de A | B não segue A; C segue | B não vê; C vê |
| 4 | Uma visita com `publicar_em` no futuro | Qualquer pessoa além de A consulta | Ela só aparece a partir da data |
| 5 | Uma visita a lugar sensível (D5) | A salva sem mexer na visibilidade | A visita nasce “só eu”; o lugar não tem galeria |
| 6 | Um lugar avaliado publicamente por 3 moradores e 8 visitantes | Qualquer pessoa abre o lugar | % de moradores e índice mostram “dados insuficientes” |
| 7 | O perfil público de A, com muitas visitas no bairro onde mora | B abre o mapa de A | B vê só cidades ou hexágonos de nível 7, sem o rótulo da cidade de residência |
| 8 | Uma foto enviada com GPS nos metadados (EXIF) | O arquivo é salvo | O arquivo armazenado não tem nenhum metadado |
| 9 | Uma visita “só eu” que rendeu o selo “primeiro a registrar” | B abre o lugar | O selo não aparece |


---
Parte do documento de visão do Lugora (v0.5.1). Índice: [README](README.md).
