import Link from "next/link";
import { HomeAcervo } from "@/components/home-acervo";
import { HomeCarrosselDestaques } from "@/components/home-carrossel-destaques";
import { HomeContinuarAssistindo } from "@/components/home-continuar-assistindo";
import { HomeEmAlta } from "@/components/home-em-alta";
import { ProvedorDoHistorico } from "@/components/historico-da-pessoa";
import { listarMidias } from "@/lib/api";

// Server Component: estes `await` rodam no servidor, e o navegador recebe o
// HTML já pronto. Nenhuma credencial da API chega ao cliente — as seções
// abaixo recebem os dados por props, e nenhuma delas busca nada por conta.
export default async function Home() {
  // Só o catálogo, que é igual para todo mundo. O histórico é de uma pessoa
  // e não entra aqui (LP-414): lido no servidor, ele tornaria a home dinâmica
  // — e, sem sessão, era o do mock para qualquer visitante. Ele chega pelo
  // navegador, e se falhar, só a faixa dele some.
  const { itens, total } = await listarMidias();

  const destaques = itens.slice(0, 4);

  return (
    <ProvedorDoHistorico>
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

      <HomeContinuarAssistindo itens={itens} />

      {/*
        A faixa busca sozinha, e por isso não recebe props: ela é um
        componente de servidor assíncrono. O `cache()` de `listarMidias` faz a
        busca dela e a desta página serem uma só ida à API.
      */}
      <HomeEmAlta />

      <HomeCarrosselDestaques destaques={destaques} />

      <HomeAcervo itens={itens} total={total} />
    </ProvedorDoHistorico>
  );
}
