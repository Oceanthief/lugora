/** Tela provisória: título e uma frase. Some quando a tela ganhar conteúdo. */
export function PagePlaceholder({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <section className="mx-auto max-w-md px-4 py-6">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">{text}</p>
    </section>
  );
}
