# 0009. Login por código de 6 dígitos enviado por e-mail

- **Status:** aceita (Fatia 2)
- **Data:** 2026-11-03

## Contexto

O roadmap pede login por e-mail, e o documento de visão (seção 9.4) proíbe implementar senha na mão. O caminho padrão do Supabase é o link mágico: a pessoa recebe um e-mail e clica num link.

O Lugora é um app instalável, usado principalmente no celular. Nesse cenário, o link costuma abrir no navegador do app de e-mail ou no navegador padrão, e não dentro do app instalado. No iPhone, o app instalado não compartilha cookies com o Safari. A pessoa pode clicar no link, entrar em outro lugar e continuar deslogada no app.

## Opções consideradas

1. **Link mágico:** um toque e padrão do Supabase. Contra: o problema acima; além disso, leitores de e-mail que abrem links automaticamente podem gastar o link antes da pessoa.
2. **Código de 6 dígitos:** a pessoa digita o código na mesma tela em que pediu, então a sessão nasce no lugar certo. Contra: um passo a mais, e um código curto pode ser adivinhado se não houver limite de tentativas.
3. **Login com Google:** rápido, mas exige credenciais no Google Cloud e não atende quem não quer usar uma conta Google. Fica para a Fatia 10, como opção adicional.

## Decisão

Opção 2, com o Supabase Auth:

- **Validade:** 10 minutos, e cada código funciona uma vez.
- **Limites:** um e-mail por minuto para o mesmo endereço e 30 verificações a cada 5 minutos por IP.
- **E-mail:** template próprio em português, só com o código, sem link.
- **Sessão:** no servidor, em cookies que o JavaScript da página não lê (`httpOnly`). O app faz as chamadas de login em Server Actions, sem cliente do Supabase no navegador.
- **Sem senha, de verdade:** a API do Supabase Auth aceita criar conta com senha, mesmo sem o app oferecer isso. A revisão de privacidade reproduziu o ataque: alguém criava a conta com o e-mail de outra pessoa, ela confirmava com o próprio código, e a senha escolhida por quem atacou continuava valendo. Por isso:
  - a confirmação de e-mail fica ligada (`enable_confirmations`), e ninguém recebe sessão sem o código;
  - um gatilho em `auth.users` descarta qualquer senha, ao criar e ao alterar a conta.

## Consequências

- O template, os limites e a confirmação de e-mail valem para o banco local, em `supabase/config.toml`. O projeto na nuvem (Fatia 4) precisa da mesma configuração, senão volta a mandar link. O gatilho vai com as migrações.
- Login por senha nunca funcionará neste projeto sem remover o gatilho. Para o login com Google (Fatia 10), o gatilho não atrapalha, mas o ataque equivalente precisa ser testado de novo.
- A produção precisa de um provedor de e-mail próprio (SMTP); o do Supabase é só para testes. Fica para a Fatia 10.
- Se um dia o navegador precisar falar direto com o Supabase, os cookies `httpOnly` terão de ser revistos, porque o cliente de navegador precisa lê-los.
