import type { Serie } from "@/lib/tipos";

/**
 * Qual temporada a lista mostra, pela posição dentro de `serie.temporadas`.
 *
 * As temporadas já vêm completas do servidor — episódios inclusive —, então
 * trocar de temporada é escolher outro item do array que já está aqui, e não
 * uma ida nova à API. É por isso que o seletor não precisa de rota própria.
 */
const TEMPORADA_SELECIONADA = 0;

export function FichaTemporadas({ serie }: { serie: Serie }) {
  const temporada = serie.temporadas[TEMPORADA_SELECIONADA];

  return (
    <section aria-labelledby="temporadas" className="mt-12">
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <h2 id="temporadas" className="text-xl font-semibold">
          Episódios
        </h2>

        <label htmlFor="temporada" className="sr-only">
          Escolher temporada
        </label>
        <select
          id="temporada"
          name="temporada"
          defaultValue={TEMPORADA_SELECIONADA}
          className="rounded-md border border-white/15 bg-zinc-900 px-3 py-1.5 text-sm"
        >
          {serie.temporadas.map((t, indice) => (
            <option key={t.numero} value={indice}>
              Temporada {t.numero} ({t.ano}) 
            </option>
          ))}
        </select>
      </div>

      {/*
        Temporada anunciada e ainda sem episódios é caso previsto no contrato
        (`episodios: []`) — não é erro, e a lista vazia precisa dizer isso em
        vez de aparecer como um bloco em branco.
      */}
      {temporada.episodios.length === 0 ? (
        <p className="text-sm text-zinc-500">
          Os episódios desta temporada ainda não foram anunciados.
        </p>
      ) : (
        <ol className="divide-y divide-white/10 border-y border-white/10">
          {temporada.episodios.map((ep) => (
            <li
              key={ep.numero}
              className="flex flex-wrap items-baseline gap-x-3 py-3 text-sm"
            >
              <span className="w-6 shrink-0 text-zinc-500">{ep.numero}</span>
              <span className="text-zinc-200">{ep.titulo}</span>
              {/*
                TODO (sprint 2): o título do episódio vira link para
                /midias/[slug]/t/[temporada]/ep/[episodio], que ainda não existe.
              */}
              <span className="ml-auto text-zinc-500">{ep.duracaoMin} min</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
