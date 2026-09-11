
import Image from "next/image";
import Link from "next/link";
import type { ItemHistorico, Midia } from "@/lib/tipos";

type Props = {
  /** Histórico de onde a pessoa parou de assistir. */
  historico: ItemHistorico[];

  /** Catálogo de mídias. */
  itens: Midia[];
};

/**
 * Retorna a duração da mídia em segundos.
 *
 * Para séries com temporada e episódio no histórico,
 * usamos a duração do episódio.
 */
function duracaoEmSegundos(
  item: ItemHistorico,
  midia: Midia,
): number | null {
  if (
    midia.tipo === "serie" &&
    item.temporadaNumero !== undefined &&
    item.episodioNumero !== undefined
  ) {
    const temporada = midia.temporadas.find(
      (temporada) =>
        temporada.numero === item.temporadaNumero,
    );

    const episodio = temporada?.episodios.find(
      (episodio) =>
        episodio.numero === item.episodioNumero,
    );

    if (!episodio) {
      return null;
    }

    return episodio.duracaoMin * 60;
  }

  if (
    midia.duracaoMin === undefined ||
    midia.duracaoMin <= 0
  ) {
    return null;
  }

  return midia.duracaoMin * 60;
}

/**
 * Calcula a porcentagem assistida.
 */
function percentualAssistido(
  item: ItemHistorico,
  midia: Midia,
): number | null {
  const duracao = duracaoEmSegundos(item, midia);

  if (duracao === null) {
    return null;
  }

  const percentual =
    (item.segundosAssistidos / duracao) * 100;

  return Math.min(100, Math.round(percentual));
}

/**
 * Retorna o rótulo da temporada e episódio.
 */
function rotuloDoEpisodio(
  item: ItemHistorico,
): string | null {
  if (
    item.temporadaNumero === undefined ||
    item.episodioNumero === undefined
  ) {
    return null;
  }

  return `T${item.temporadaNumero} · E${item.episodioNumero}`;
}

export function HomeContinuarAssistindo({
  historico,
  itens,
}: Props) {
  /*
   * Relaciona o histórico com a mídia correspondente.
   * Históricos sem uma mídia existente no catálogo são ignorados.
   */
  const emAndamento = historico
    .flatMap((item) => {
      const midia = itens.find(
        (midia) => midia.slug === item.midiaSlug,
      );

      return midia ? [{ item, midia }] : [];
    })
    .toSorted(
      (a, b) =>
        new Date(b.item.atualizadoEm).getTime() -
        new Date(a.item.atualizadoEm).getTime(),
    );

  /*
   * Sem histórico válido, não exibe a seção.
   */
  if (emAndamento.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="continuar"
      className="mb-14"
    >
      <h2
        id="continuar"
        className="mb-5 text-xl font-semibold"
      >
        Continuar assistindo
      </h2>

      <ul className="grid gap-4 sm:grid-cols-2">
        {emAndamento.map(({ item, midia }) => {
          const percentual = percentualAssistido(
            item,
            midia,
          );

          const episodio = rotuloDoEpisodio(item);

          /*
           * Se houver temporada e episódio no histórico,
           * eles são enviados na URL para o Retomar.
           */
          const parametros =
            item.temporadaNumero !== undefined &&
            item.episodioNumero !== undefined
              ? `?temporada=${item.temporadaNumero}&episodio=${item.episodioNumero}#episodio-${item.episodioNumero}`
              : "";

          const href = `/midias/${midia.slug}${parametros}`;

          return (
            <li
              key={`${item.midiaSlug}-${item.temporadaNumero ?? ""}-${item.episodioNumero ?? ""}`}
              className="flex gap-4 rounded-lg border border-white/10 bg-zinc-900/40 p-3"
            >
              <Image
                src={
                  midia.posterUrl ??
                  "/capas/sem-capa.svg"
                }
                alt=""
                width={300}
                height={450}
                className="h-24 w-16 shrink-0 rounded-md border border-white/10 object-cover"
              />

              <div className="min-w-0 flex-1">
                <h3 className="truncate font-medium">
                  {midia.titulo}
                </h3>

                {episodio && (
                  <p className="mt-0.5 text-sm text-zinc-500">
                    {episodio}
                  </p>
                )}

                {percentual !== null ? (
                  <>
                    <div
                      role="progressbar"
                      aria-label={`Progresso de ${midia.titulo}: ${percentual}%`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={percentual}
                      className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"
                    >
                      <div
                        className="h-full rounded-full bg-violet-500"
                        style={{
                          width: `${percentual}%`,
                        }}
                      />
                    </div>

                    <p className="mt-1.5 text-xs text-zinc-500">
                      {percentual}% assistido
                    </p>
                  </>
                ) : (
                  <p className="mt-3 text-xs text-zinc-500">
                    Você parou no meio — a duração deste
                    título ainda não está no catálogo.
                  </p>
                )}

                <Link
                  href={href}
                  className="mt-3 inline-block rounded-full border border-white/15 px-3 py-1 text-sm font-medium transition hover:border-violet-500 hover:text-violet-300"
                >
                  Retomar
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

