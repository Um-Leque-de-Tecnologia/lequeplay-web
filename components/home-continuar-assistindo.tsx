import Image from "next/image";
import Link from "next/link";
import type { ItemHistorico, Midia } from "@/lib/tipos";

type Props = {
  /** As linhas do player: onde a pessoa parou em cada título que começou. */
  historico: ItemHistorico[];

  /** O catálogo, para casar cada linha com capa, título e duração. */
  itens: Midia[];
};

/**
 * Calcula quanto do título já foi assistido, em porcentagem.
 *
 * O histórico guarda segundos.
 * A mídia guarda minutos.
 *
 * Portanto, precisamos converter a duração para segundos
 * antes de fazer a divisão.
 */
function percentualAssistido(
  item: ItemHistorico,
  midia: Midia,
): number {
  /*
   * `duracaoMin` é opcional na API.
   *
   * Se estiver ausente ou for 0, não existe uma duração
   * válida para calcular a porcentagem.
   */
  if (!midia.duracaoMin || midia.duracaoMin <= 0) {
    return 0;
  }

  /*
   * A duração da mídia vem em minutos.
   * O histórico vem em segundos.
   *
   * Exemplo:
   * 60 minutos = 3600 segundos.
   */
  const duracaoEmSegundos = midia.duracaoMin * 60;

  /*
   * Calcula a porcentagem e impede que a barra passe de 100%.
   */
  return Math.min(
    100,
    Math.round(
      (item.segundosAssistidos / duracaoEmSegundos) * 100,
    ),
  );
}

/**
 * Retorna "T2 · E2" quando o histórico possui
 * temporada e episódio.
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

export function HomeContinuarAssistindo({ historico,  itens, }: Props) {
  /*
   * Junta cada item do histórico com a mídia correspondente
   * no catálogo.
   *
   * Se a mídia não existir mais no catálogo, ela é ignorada.
   */
  const emAndamento = historico.flatMap((item) => {
    const midia = itens.find(
      (m) => m.slug === item.midiaSlug,
    );

    return midia ? [{ item, midia }] : [];
  });

  /*
   * Se a conta não possui histórico válido,
   * não mostra a faixa "Continuar assistindo".
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
           * Quando o histórico possui temporada e episódio,
           * colocamos essas informações na URL.
           *
           * Exemplo:
           *
           * /midias/protocolo-aberto?temporada=2&episodio=2
           */
          const parametros =
            item.temporadaNumero !== undefined &&
            item.episodioNumero !== undefined
              ? `?temporada=${item.temporadaNumero}&episodio=${item.episodioNumero}`
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