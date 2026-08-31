import { CardMidia } from "@/components/card-midia";
import type { ItemHistorico, Midia } from "@/lib/tipos";

type Props = {
  itens: Midia[];
  /** Serve ao filtro: quem já apareceu aqui a pessoa já começou a ver. */
  historico: ItemHistorico[];
};

export function HomeAcervo({ itens, historico }: Props) {
  // `Set` e não `array`: a pergunta é "esse slug está aqui?", e ela é feita
  // uma vez por título do acervo.
  const jaComecados = new Set(historico.map((h) => h.midiaSlug));

  // O recorte do filtro: o que sobra depois de tirar o que já foi aberto.
  const naoVistos = itens.filter((midia) => !jaComecados.has(midia.slug));

  return (
    <section aria-labelledby="acervo">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="acervo" className="text-xl font-semibold">
          O acervo
        </h2>
        <p className="text-sm text-zinc-500">0 títulos no acervo</p>
      </div>

      {/*
        <label> envolvendo o campo: o texto inteiro vira área de clique, sem
        precisar casar `id` com `htmlFor`.
      */}
      <div className="mb-6">
        <label className="inline-flex items-center gap-2 text-sm text-zinc-400">
          <input
            type="checkbox"
            name="nao-vistos"
            className="size-4 accent-violet-600"
          />
          Só o que eu ainda não vi ({naoVistos.length})
        </label>
      </div>

      <ul className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
        {itens.map((midia) => (
          <li key={midia.id}>
            <CardMidia midia={midia} />
          </li>
        ))}
      </ul>
    </section>
  );
}
