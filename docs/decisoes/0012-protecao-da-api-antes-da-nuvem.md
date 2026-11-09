# 0012. Proteção da API antes da nuvem

- **Status:** aceita (Fatia 4)
- **Data:** 2026-11-09

## Contexto

Até a Fatia 3, o banco só existia no computador. A Fatia 4 leva o app para a homologação (Supabase em São Paulo e Vercel), e a seção 9.4 pede "limite de requisições contra spam e abuso". Três fatos pesaram:

- **Polígonos:** qualquer pessoa, mesmo sem login, baixava pela API os limites de 5.571 cidades e 219 países, cerca de 285 MB (revisão da Fatia 2). O app só usa o nome e a UF.
- **IP do servidor:** o app fala com o Supabase pelo servidor (Server Actions na Vercel). O banco e o login veem o IP do servidor, o mesmo para todo mundo.
- **Chamadas diretas:** quem tem uma conta pode chamar a API do Supabase direto, com o próprio token, sem passar pelo app.

## Opções consideradas

1. **Limite por IP, na Vercel:** é o padrão na web. Contra: precisa de um armazenamento compartilhado (Redis, uma dependência nova) e não pega quem chama a API do Supabase direto.
2. **Limite por pessoa, no banco:** a API do Supabase (PostgREST) chama uma função antes de cada pedido (`db_pre_request`). Vale para o app e para chamadas diretas, sem dependência nova. Contra: cada escrita grava uma linha a mais; não cobre leituras nem o login.
3. **Nenhum limite até o beta:** menos trabalho. Contra: a seção 9.4 pede, e a homologação já fica na internet.

## Decisão

Opção 2, mais três medidas:

- **Limite de escritas:** 60 a cada 5 minutos por pessoa logada (`api_write_limit` e `api_write_window`). A escrita seguinte recebe 429, com "Retry-After: 60". As leituras rodam em transação só de leitura e não contam. Conferido por HTTP, inclusive com as buscas, que chegam por POST.
- **Polígonos fora da API:** saem para todo mundo; nomes, UF e ids continuam públicos. A Fatia 6 vai ler polígonos simplificados por uma função. Saem também as permissões de escrita em países e cidades, que o RLS já barrava.
- **Teto de linhas:** a API continua devolvendo no máximo 1.000 linhas por pedido (`max_rows`).
- **"Perto de mim":** raio de 300 m e até 10 lugares (`nearby_places_radius_meters` e `nearby_places_limit`), só com o consentimento de localização. A posição não é gravada.

## Consequências

- **Login dividido:** o Auth do Supabase conta por IP: 30 pedidos de código e 30 conferências a cada 5 minutos. Com o login pelo servidor, todo mundo divide esse limite, e uma pessoa insistindo trava o login das outras. Na homologação, só o Victor usa. Antes do beta, é preciso escolher: chamar o Auth pelo navegador ou ajustar os limites no painel (Authentication > Rate Limits).
- **E-mail da nuvem como está:** o serviço padrão do Supabase só entrega para quem é da equipe do projeto, e no máximo 2 e-mails por hora no projeto todo. Serve para o Victor testar; o beta precisa de SMTP próprio.
- **Escrita com erro não conta,** porque o erro desfaz a transação inteira, inclusive a contagem. Pedidos assim são recusados cedo e custam pouco.
- **Leituras sem limite próprio:** a proteção delas é o teto de linhas e o tempo máximo de consulta. Revisar com dados de uso, depois do beta.
- **Configuração da API dentro da migração:** o `db_pre_request` é ativado por um `alter role authenticator`. É preciso conferir na homologação que ele vale lá também, com uma escrita além do limite.
