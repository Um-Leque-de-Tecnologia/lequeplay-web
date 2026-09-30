"use client";

import { useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type Props = {
  consulta: string;
};

export function CatalogoBusca({ consulta }: Props) {
  const router = useRouter();
  const [estaBuscando, iniciarBusca] = useTransition();

  function buscar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const dados = new FormData(evento.currentTarget);
    const termo = dados.get("q");
    const destino =
      typeof termo === "string" && termo
        ? `/midias?q=${encodeURIComponent(termo)}`
        : "/midias";

    iniciarBusca(() => {
      router.push(destino);
    });
  }

  return (
    <form
      role="search"
      onSubmit={buscar}
      className="mt-6 flex flex-wrap items-center gap-2"
    >
      <label htmlFor="q" className="sr-only">
        Buscar no catálogo
      </label>
      <input
        id="q"
        name="q"
        type="search"
        defaultValue={consulta}
        placeholder="Buscar por título"
        className="min-w-64 flex-1 rounded-md border border-white/15 bg-zinc-900 px-3 py-2 text-base placeholder:text-zinc-600"
      />
      <button
        type="submit"
        className="rounded-md bg-violet-600 px-4 py-2 font-medium text-white transition hover:bg-violet-500"
      >
        Buscar
      </button>
      {/* A região existe desde o primeiro render, vazia, e só o texto muda.
          Leitor de tela anuncia mudança numa região que ele já conhece; uma
          região que nasce com o texto pronto pode passar em silêncio. */}
      <p role="status" className="text-sm text-zinc-400">
        {estaBuscando ? "Buscando…" : null}
      </p>
    </form>
  );
}
