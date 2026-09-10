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
 * O total contra o qual o progresso é medido, em segundos.
 *
 * Quem manda é o EPISÓDIO, quando o histórico diz qual está tocando:
 * `segundosAssistidos` é uma posição dentro de um episódio, enquanto
 * `Midia.duracaoMin` é o runtime da série inteira, somado pelo backend
 * (lib/tipos.ts). Dividir um pelo outro dá sempre um número pequeno demais, e
 * quanto mais temporadas a série tem, mais errado fica.
 *
 * Devolve `null` quando não há denominador confiável — e aí quem chama não
 * desenha a barra. Dado ausente não é zero: afirmar "0% assistido" para uma
 * duração que a API omitiu é dizer um número que não se tem, e o
 * `aria-valuenow` faz o leitor de tela repetir a mesma mentira.
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
    /*
     * Pelo `numero`, nunca pelo índice do array:
     * protocolo-aberto tem temporada 0 (especiais),
     * e ali os dois não coincidem.
     */
    const temporada = midia.temporadas.find(
      (t) => t.numero === item.temporadaNumero,
    );

    const episodio = temporada?.episodios.find(
      (e) => e.numero === item.episodioNumero,
    );

    /*
     * Episódio que saiu do catálogo: o histórico
     * continua apontando para ele. Cair na duração
     * da série aqui seria repetir o erro que esta
     * função existe para não cometer.
     */
    return episodio
      ? episodio.duracaoMin * 60
      : null;
  }

  /*
   * Filme, podcast, ou linha antiga do player — as que
   * guardaram só o título. Para elas a única duração
   * disponível é a da mídia inteira, e ela é opcional
   * na API (`omitempty`).
   */
  if (
    midia.duracaoMin === undefined ||
    midia.duracaoMin <= 0
  ) {
    return null;
  }

  return midia.duracaoMin * 60;
}

/**
 * Quanto do que está tocando já foi assistido, em porcentagem — ou `null`
 * quando não dá para saber.
 */
function percentualAssistido(
  item: ItemHistorico,
  midia: Midia,
): number | null {
  const duracao = duracaoEmSegundos(item, midia);

  if (duracao === null) {
    return null;
  }

  /*
   * Impede que a barra passe de 100%.
   */
  return Math.min(
    100,
    Math.round(
      (item.segundosAssistidos / duracao) * 100,
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

                {/*
                  Sem duração confiável não há barra: o título continua na
                  faixa, com o "Retomar", e nada é afirmado sobre o quanto
                  falta. É o caso de onde-o-rio-vira, cuja série veio sem
                  `duracaoMin` e cujo histórico não diz o episódio.
                */}
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