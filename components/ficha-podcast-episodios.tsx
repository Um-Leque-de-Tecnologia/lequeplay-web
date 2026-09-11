"use client";

import { useMemo, useState } from "react";
import { formatarDataPorExtenso } from "@/lib/formatadores";
import type { EpisodioPodcast } from "@/lib/tipos";

type Props = {
  episodios: EpisodioPodcast[];
  totalEpisodios: number;
};

/**
 * Quantos episódios mostrar antes do botão de expandir.
 *
 * Em podcasts com dezenas ou centenas de episódios, renderizar a lista
 * inteira infla o DOM desnecessariamente e empurra a área de resenhas
 * e compartilhamento para fora do alcance de leitura. O corte em 5
 * apresenta os mais recentes com rapidez e dá controle a quem quiser ver mais.
 */
const LIMITE_INICIAL = 5;

export function FichaPodcastEpisodios({
  episodios,
  totalEpisodios,
}: Props) {
  const [expandido, setExpandido] = useState(false);

  // Ordena do mais recente para o mais antigo sem mutar o array original.
  const episodiosOrdenados = useMemo(() => {
    return episodios.toSorted((a, b) => {
      const dataA = new Date(a.publicadoEm).getTime();
      const dataB = new Date(b.publicadoEm).getTime();
      return dataB - dataA;
    });
  }, [episodios]);

  const precisaDeCorte = episodiosOrdenados.length > LIMITE_INICIAL;
  const listaVisivel =
    precisaDeCorte && !expandido
      ? episodiosOrdenados.slice(0, LIMITE_INICIAL)
      : episodiosOrdenados;

  if (episodios.length === 0) {
    return (
      <section
        aria-labelledby="titulo-episodios"
        className="mt-8 border-t border-white/10 pt-8"
      >
        <h3
          id="titulo-episodios"
          className="text-base font-semibold text-zinc-100"
        >
          Episódios
        </h3>
        <p className="mt-2 text-sm text-zinc-500">
          Nenhum episódio disponível no momento.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="titulo-episodios"
      className="mt-8 border-t border-white/10 pt-8"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3
          id="titulo-episodios"
          className="text-base font-semibold text-zinc-100"
        >
          Episódios
        </h3>
        <span className="text-xs text-zinc-500">
          {totalEpisodios} {totalEpisodios === 1 ? "episódio" : "episódios"} no total
        </span>
      </div>

      <ol className="mt-4 divide-y divide-white/10 border-y border-white/10">
        {listaVisivel.map((episodio) => (
          <li
            key={episodio.numero}
            className="py-3 transition hover:bg-white/[0.02]"
          >
            <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
              <span className="text-sm font-medium text-zinc-200">
                Ep. {episodio.numero} · {episodio.titulo}
              </span>

              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <time dateTime={episodio.publicadoEm}>
                  {formatarDataPorExtenso(episodio.publicadoEm)}
                </time>
                <span aria-hidden="true" className="text-zinc-600">
                  ·
                </span>
                <span>{episodio.duracaoMin} min</span>
              </div>
            </div>
          </li>
        ))}
      </ol>

      {precisaDeCorte && (
        <button
          type="button"
          aria-expanded={expandido}
          onClick={() => setExpandido((prev) => !prev)}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-violet-400 transition hover:text-violet-300 focus-visible:outline-2 focus-visible:outline-violet-500"
        >
          {expandido
            ? "Ver menos"
            : `Ver todos os ${episodios.length} episódios`}
        </button>
      )}
    </section>
  );
}
