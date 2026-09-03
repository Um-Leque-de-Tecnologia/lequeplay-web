import Link from "next/link";
import { BotaoCopiarLink } from "@/components/botao-copiar-link";
import { HomeAcervo } from "@/components/home-acervo";
import { HomeCarrosselDestaques } from "@/components/home-carrossel-destaques";
import { HomeContinuarAssistindo } from "@/components/home-continuar-assistindo";
import { listarHistorico, listarMidias } from "@/lib/api";

// Server Component: estes `await` rodam no servidor, e o navegador recebe o
// HTML já pronto. Nenhuma credencial da API chega ao cliente — as seções
// abaixo recebem os dados por props, e nenhuma delas busca nada por conta.
export default async function Home() {
   console.log("[quem me executou?] a Home rodou");

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
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href="/midias"
            className="inline-block rounded-full bg-violet-600 px-5 py-2.5 font-medium text-white transition hover:bg-violet-500"
          >
            Ver o catálogo
          </Link>
          <BotaoCopiarLink className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-violet-500 hover:text-zinc-100" />
        </div>
      </section>

      <HomeContinuarAssistindo historico={historico} itens={itens} />

      <HomeCarrosselDestaques destaques={destaques} />

      <HomeAcervo itens={itens} historico={historico} />
    </>
  );
}
