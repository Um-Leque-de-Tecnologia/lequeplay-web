import { FichaPodcastEpisodios } from "@/components/ficha-podcast-episodios";
import { formatarDuracao } from "@/lib/formatadores";
import { obterApresentador, type Podcast } from "@/lib/tipos";

type Props = {
  podcast: Podcast;
};

/**
 * Ficha dedicada para Podcast (Server Component).
 *
 * Evita o reaproveitamento cego de layout de filme e série:
 * não exibe aba de elenco (inexistente em podcast), não tenta
 * ler diretor, e apresenta os metadados nativos de áudio:
 * Apresentação (derivada de `creditos`), Frequência e Total de episódios.
 */
export function FichaPodcast({ podcast }: Props) {
  const apresentador = obterApresentador(podcast);

  return (
    <div className="mt-10 border-t border-white/10 pt-8">
      <h2 className="text-lg font-semibold tracking-tight text-zinc-100">
        Ficha técnica
      </h2>

      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2.5 text-sm">
        {apresentador && (
          <>
            <dt className="text-zinc-500">Apresentação</dt>
            <dd className="text-zinc-200">{apresentador}</dd>
          </>
        )}

        {podcast.frequencia && (
          <>
            <dt className="text-zinc-500">Frequência</dt>
            <dd className="text-zinc-200">{podcast.frequencia}</dd>
          </>
        )}

        <dt className="text-zinc-500">Total de episódios</dt>
        <dd className="text-zinc-200">{podcast.totalEpisodios}</dd>

        <dt className="text-zinc-500">Ano</dt>
        <dd className="text-zinc-200">{podcast.ano}</dd>

        <dt className="text-zinc-500">
          {podcast.generos.length > 1 ? "Gêneros" : "Gênero"}
        </dt>
        <dd className="text-zinc-200">{podcast.generos.join(", ")}</dd>

        {podcast.duracaoMin !== undefined && podcast.duracaoMin > 0 && (
          <>
            <dt className="text-zinc-500">Duração total</dt>
            <dd className="text-zinc-200">
              {formatarDuracao(podcast.duracaoMin)}
            </dd>
          </>
        )}
      </dl>

      <FichaPodcastEpisodios
        episodios={podcast.episodios ?? []}
        totalEpisodios={podcast.totalEpisodios}
      />
    </div>
  );
}
