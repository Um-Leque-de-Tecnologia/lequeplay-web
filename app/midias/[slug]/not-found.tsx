import Link from "next/link";
import { CardMidia } from "@/components/card-midia";
import { listarMidias } from "@/lib/api";

export default async function MidiaNaoEncontrada() {
  const { itens } = await listarMidias();
  const destaques = itens.slice(0, 6);

  return (
    <>
      <section className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-violet-300">
          404
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Não encontramos esse título
        </h1>
        <p className="mx-auto mt-4 max-w-prose text-zinc-400">
          Ele pode ter saído do catálogo ou o endereço pode estar incorreto.
          Tente buscar outro título.
        </p>

        <form
          role="search"
          action="/midias"
          className="mt-10 flex flex-col gap-2 sm:flex-row"
        >
          <label htmlFor="q-nao-encontrado" className="sr-only">
            Buscar filmes, séries e podcasts
          </label>
          <div className="relative min-w-0 flex-1">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
            >
              🔍
            </span>
            <input
              id="q-nao-encontrado"
              name="q"
              type="search"
              placeholder="Buscar filmes, séries e podcasts"
              className="w-full rounded-md border border-white/15 bg-zinc-900 py-2 pl-10 pr-3 text-base placeholder:text-zinc-600"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-violet-600 px-4 py-2 font-medium text-white transition hover:bg-violet-500 sm:w-auto"
          >
            Buscar
          </button>
        </form>

        <Link
          href="/midias"
          className="mt-8 inline-block rounded-full border border-white/15 px-5 py-2.5 font-medium text-zinc-200 transition hover:border-violet-500 hover:text-zinc-100"
        >
          Explorar o catálogo
        </Link>

        <p className="mt-5">
          <Link
            href="/"
            className="text-sm text-zinc-500 transition hover:text-zinc-100"
          >
            ← Voltar ao início
          </Link>
        </p>
      </section>

      {destaques.length > 0 && (
        <section aria-labelledby="outros-titulos" className="mt-20">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 id="outros-titulos" className="text-xl font-semibold">
              Explore outros títulos
            </h2>
            <Link
              href="/midias"
              className="text-sm text-violet-300 transition hover:text-violet-200"
            >
              Ver todo o catálogo →
            </Link>
          </div>
          <p className="mt-2 text-sm text-zinc-500">
            Continue navegando pelo catálogo.
          </p>
          <ul className="mt-6 grid grid-cols-2 gap-6 lg:grid-cols-6">
            {destaques.map((midia, indice) => (
              <li
                key={midia.id}
                className={indice >= 4 ? "hidden lg:block" : undefined}
              >
                <CardMidia midia={midia} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
