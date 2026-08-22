import Link from "next/link";
import { CardMidia } from "@/components/card-midia";
import { listarMidias } from "@/lib/api";

// Server Component: este `await` roda no servidor, e o navegador recebe o
// HTML já pronto. Nenhuma credencial da API chega ao cliente.
export default async function Home() {
  const { itens } = await listarMidias();
  const destaques = itens.slice(0, 4);

  return (
    <>
      <section className="mb-14">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          O que você quer ver hoje?
        </h1>
        <p className="mt-3 max-w-prose text-zinc-400">
          Filmes, séries e podcasts num catálogo só — para achar pelo que você
          está a fim de assistir, não pelo título exato.
        </p>
        <Link
          href="/midias"
          className="mt-6 inline-block rounded-full bg-violet-600 px-5 py-2.5 font-medium text-white transition hover:bg-violet-500"
        >
          Ver o catálogo
        </Link>
      </section>

      <section aria-labelledby="destaques">
        <h2 id="destaques" className="mb-5 text-xl font-semibold">
          Em destaque
        </h2>

        {/* É uma lista, então é <ul> — o leitor de tela anuncia quantos itens. */}
        <ul className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
          {destaques.map((midia) => (
            <li key={midia.id}>
              <CardMidia midia={midia} />
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
