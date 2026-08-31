import { CardMidia } from "@/components/card-midia";
import type { Midia } from "@/lib/tipos";

/**
 * O carrossel de destaques da home.
 *
 * Ele recebe os destaques prontos, por props: quem busca é a página, no
 * servidor. Um carrossel é enfeite de apresentação — não é motivo para
 * arrastar a chamada da API para o navegador.
 */
export function HomeCarrosselDestaques({ destaques }: { destaques: Midia[] }) {
  return (
    <section
      aria-labelledby="destaques"
      aria-roledescription="carrossel"
      className="mb-14"
    >
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 id="destaques" className="text-xl font-semibold">
          Em destaque
        </h2>

        <div className="flex gap-2">
          <button
            type="button"
            aria-label="Destaque anterior"
            className="rounded-full border border-white/15 px-3 py-1 text-sm transition hover:border-violet-500 hover:text-violet-300"
          >
            ←
          </button>
          <button
            type="button"
            aria-label="Próximo destaque"
            className="rounded-full border border-white/15 px-3 py-1 text-sm transition hover:border-violet-500 hover:text-violet-300"
          >
            →
          </button>
        </div>
      </div>

      {/*
        O trilho: os slides ficam lado a lado e o `snap` faz cada parada cair
        no começo de um card, em vez de no meio de dois. Continua sendo <ul>
        porque continua sendo uma lista — o leitor de tela anuncia quantos
        itens, mesmo com só um aparecendo por vez.
      */}
      <ul className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-2">
        {destaques.map((midia) => (
          <li key={midia.id} className="w-44 shrink-0 snap-start sm:w-52">
            <figure>
              <CardMidia midia={midia} />
              <figcaption className="mt-2 text-xs uppercase tracking-wide text-violet-300">
                Destaque da semana
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </section>
  );
}
