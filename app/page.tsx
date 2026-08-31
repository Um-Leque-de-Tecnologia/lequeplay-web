import Link from "next/link";
import { HomeAcervo } from "@/components/home-acervo";
import { HomeCarrosselDestaques } from "@/components/home-carrossel-destaques";
import { HomeContinuarAssistindo } from "@/components/home-continuar-assistindo";
import { listarHistorico, listarMidias } from "@/lib/api";

// Server Component: estes `await` rodam no servidor, e o navegador recebe o
// HTML já pronto. Nenhuma credencial da API chega ao cliente — as seções
// abaixo recebem os dados por props, e nenhuma delas busca nada por conta.
export default async function Home() {
  // As duas buscas não dependem uma da outra: em série, a home esperaria a
  // soma das duas; em paralelo, espera a mais lenta.
  const [{ itens }, historico] = await Promise.all([
    listarMidias(),
    listarHistorico(),
  ]);

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

      <HomeContinuarAssistindo historico={historico} itens={itens} />

      <HomeCarrosselDestaques destaques={destaques} />

      <HomeAcervo itens={itens} historico={historico} />
    </>
  );
}
