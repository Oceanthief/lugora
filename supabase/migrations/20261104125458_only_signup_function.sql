-- Segunda rodada da revisão de privacidade: o cadastro passa a ser o único caminho.
-- Com o insert direto, um POST em profiles_private gravava age_confirmed_at = now() sem a pessoa
-- ter declarado nada. A linha liberava a leitura dos perfis e permitia criar o próprio perfil,
-- sem nunca passar pela confirmação de 18+ de complete_signup.

drop policy profiles_private_insert_own on public.profiles_private;
drop policy profiles_insert_own on public.profiles;

revoke insert on table public.profiles_private from authenticated;
revoke insert on table public.profiles from authenticated;

-- Sem permissão de insert para quem chama, a função precisa rodar com as permissões do dono dela.
-- É seguro porque ela só grava para auth.uid(), nunca para um id recebido; recusa quem não está
-- logado; confere o 18+ e o aceite; e usa search_path vazio, para ninguém trocar uma tabela por
-- outra de mesmo nome. Um teste garante que ela é a única função assim no schema public.
alter function public.complete_signup(text, text, uuid, boolean, boolean, text[]) security definer;
