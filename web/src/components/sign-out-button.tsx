"use client";

// Client Component: sair recarrega a página inteira, e isso só o navegador faz.

import { signOut } from "@/app/entrar/actions";

/**
 * O Next mantém as telas vivas na memória, mesmo escondidas. Recarregar ao sair
 * apaga tudo o que era de quem saiu, como a busca, o rascunho e a posição.
 */
export function SignOutButton({ label, className }: { label: string; className: string }) {
  return (
    <form
      action={async () => {
        await signOut();
        window.location.reload();
      }}
    >
      <button type="submit" className={className}>
        {label}
      </button>
    </form>
  );
}
