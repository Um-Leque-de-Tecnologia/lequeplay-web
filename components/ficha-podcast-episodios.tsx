import Link from "next/link";
import { formatarDataPorExtenso, formatarDuracao } from "@/lib/formatadores";
import type { EpisodioPodcast } from "@/lib/tipos";

type Props = {
  slug: string;
  episodios: EpisodioPodcast[];
  totalEpisodios: number;
  temMaisEpisodios: boolean;
  expandido: boolean;
};

/**
 * Exibe a lista de episódios do podcast (Server Component).
 *
 * O corte de volume é resolvido no servidor: se não estiver expandido,
 * apenas os episódios mais recentes são transferidos no HTML / payload RSC.
 * O controle de "Ver todos" / "Ver menos" é feito via Link semântico
 * com `?episodios=todos`, garantindo Progressive Enhancement (funciona sem JS)
 * e URL compartilhável sem sobrecarregar o cliente.
 */
export function FichaPodcastEpisodios({
  slug,
  episodios,
  totalEpisodios,
  temMaisEpisodios,
  expandido,
}: Props) {
  if (episodios.length === 0) {
    return (
      <section
        id="episodios"
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
      id="episodios"
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
        {episodios.map((episodio) => (
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
                <span>{formatarDuracao(episodio.duracaoMin)}</span>
              </div>
            </div>
          </li>
        ))}
      </ol>

      {temMaisEpisodios && (
        <div className="mt-4">
          {expandido ? (
            <Link
              href={`/midias/${slug}#episodios`}
              scroll={false}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-violet-400 transition hover:text-violet-300 focus-visible:outline-2 focus-visible:outline-violet-500"
            >
              Ver menos
            </Link>
          ) : (
            <Link
              href={`/midias/${slug}?episodios=todos#episodios`}
              scroll={false}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-violet-400 transition hover:text-violet-300 focus-visible:outline-2 focus-visible:outline-violet-500"
            >
              Ver todos os {totalEpisodios} episódios
            </Link>
          )}
        </div>
      )}
    </section>
  );
}
