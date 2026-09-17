"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="mx-auto flex min-h-[50vh] max-w-2xl flex-col items-start justify-center py-16">
      <p className="text-sm font-medium uppercase tracking-wide text-violet-300">
        Algo saiu do ar
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
        Não conseguimos carregar o LequePlay agora.
      </h1>
      <p className="mt-4 text-base leading-7 text-zinc-400">
        A conexão com o catálogo falhou. Espere alguns instantes e tente
        novamente.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-8 rounded-full bg-violet-600 px-5 py-2.5 font-medium text-white transition hover:bg-violet-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-400"
      >
        Tentar de novo
      </button>
    </section>
  );
}
