import type { Metadata } from "next";
import { CatalogoChipsGenero } from "@/components/catalogo-chips-genero";
import { CatalogoGrade } from "@/components/catalogo-grade";
import { listarGeneros, listarMidias } from "@/lib/api";
import type { Midia } from "@/lib/tipos";

export const metadata: Metadata = { title: "Catálogo" };

// `searchParams` é uma Promise no Next 16 — precisa de await.
export default async function Catalogo({ searchParams }: PageProps<"/midias">) {
  const { tipo, q } = await searchParams;

  // `Promise.all` porque uma busca não depende da outra: em série, a página
  // esperaria a soma dos dois tempos em vez do maior deles.
  const [{ itens }, generos] = await Promise.all([
    listarMidias({
      tipo: typeof tipo === "string" ? (tipo as Midia["tipo"]) : undefined,
      q: typeof q === "string" ? q : undefined,
    }),
    listarGeneros(),
  ]);

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        Catálogo
      </h1>

      {/*
        A busca ainda não funciona de verdade: hoje ela só filtra por título
        exato, no cliente da API. Fazer ela entender intenção é o ticket da
        sprint 6.
      */}
      <form role="search" className="mt-6 flex flex-wrap gap-2">
        <label htmlFor="q" className="sr-only">
          Buscar no catálogo
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={typeof q === "string" ? q : ""}
          placeholder="Buscar por título"
          className="min-w-64 flex-1 rounded-md border border-white/15 bg-zinc-900 px-3 py-2 text-base placeholder:text-zinc-600"
        />
        <button
          type="submit"
          className="rounded-md bg-violet-600 px-4 py-2 font-medium text-white transition hover:bg-violet-500"
        >
          Buscar
        </button>
      </form>

      <CatalogoChipsGenero generos={generos} />

      <CatalogoGrade itens={itens} />
    </>
  );
}
