import { FichaPodcastEpisodios } from "@/components/ficha-podcast-episodios";
import { obterApresentador } from "@/lib/creditos";
import { formatarDataPorExtenso, formatarDuracao } from "@/lib/formatadores";
import type { Podcast } from "@/lib/tipos";

type Props = {
  podcast: Podcast;
  mostrarTodosEpisodios?: boolean;
};

const LIMITE_INICIAL = 5;

/**
 * Ficha dedicada para Podcast (Server Component).
 *
 * Evita o reaproveitamento cego de layout de filme e série:
 * não exibe aba de elenco (inexistente em podcast), não tenta
 * ler diretor, e apresenta os metadados nativos de áudio:
 * Apresentação (derivada de `creditos`), Frequência, Total de episódios,
 * Data do último episódio, Ano e Duração total.
 *
 * Realiza o corte inicial dos episódios no próprio servidor,
 * evitando inflar o payload RSC da página em podcasts longos.
 */
export function FichaPodcast({
  podcast,
  mostrarTodosEpisodios = false,
}: Props) {
  const apresentador = obterApresentador(podcast);

  const episodios = podcast.episodios ?? [];
  // Ordena do mais recente para o mais antigo sem mutar o array original.
  const episodiosOrdenados = [...episodios].sort((a, b) => {
    const dataA = new Date(a.publicadoEm).getTime();
    const dataB = new Date(b.publicadoEm).getTime();
    return dataB - dataA;
  });

  const ultimoEpisodio = episodiosOrdenados[0];
  const totalEpisodios = podcast.totalEpisodios;

  // Duas razões para oferecer "Ver todos": ou a lista que chegou é maior que o
  // limite, ou ela já veio incompleta da API — `episodios` é opcional no
  // contrato, e um podcast de 300 episódios pode mandar só os últimos. Sem a
  // segunda checagem, o caso que motivou o ticket ficaria sem nenhum caminho
  // para os demais episódios.
  const precisaDeCorte =
    episodiosOrdenados.length > LIMITE_INICIAL ||
    totalEpisodios > episodiosOrdenados.length;

  // Corte no servidor: se não estiver expandido, envia apenas os 5 mais recentes
  const episodiosExibidos =
    precisaDeCorte && !mostrarTodosEpisodios
      ? episodiosOrdenados.slice(0, LIMITE_INICIAL)
      : episodiosOrdenados;

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
        <dd className="text-zinc-200">{totalEpisodios}</dd>

        {ultimoEpisodio && (
          <>
            <dt className="text-zinc-500">Último episódio</dt>
            <dd className="text-zinc-200">
              {formatarDataPorExtenso(ultimoEpisodio.publicadoEm)}
            </dd>
          </>
        )}

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
        slug={podcast.slug}
        episodios={episodiosExibidos}
        totalEpisodios={totalEpisodios}
        temMaisEpisodios={precisaDeCorte}
        expandido={mostrarTodosEpisodios}
      />
    </div>
  );
}
