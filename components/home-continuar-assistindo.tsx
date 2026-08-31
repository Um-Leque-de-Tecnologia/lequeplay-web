import Image from "next/image";
import type { ItemHistorico, Midia } from "@/lib/tipos";

type Props = {
  /** As linhas do player: onde a pessoa parou em cada título que começou. */
  historico: ItemHistorico[];
  /** O catálogo, para casar cada linha com capa, título e duração. */
  itens: Midia[];
};

/**
 * Quanto do título já rodou, em porcentagem.
 *
 * O histórico guarda só a posição; a duração mora na mídia. Cruzar os dois é
 * trabalho da tela — por isso a função recebe os dois lados.
 */
function percentualAssistido(item: ItemHistorico, midia: Midia): number {
  const duracao = Number(midia.duracaoMin);

  // A barra não passa de 100% nem quando o player grava uma posição além do
  // fim (acontece: o player salva a posição depois dos créditos).
  return Math.min(100, Math.round((item.segundosAssistidos / duracao) * 100));
}

/** "T2 · E2" — só quando o player soube dizer qual episódio estava tocando. */
function rotuloDoEpisodio(item: ItemHistorico): string | null {
  if (item.temporadaNumero === undefined || item.episodioNumero === undefined) {
    return null;
  }

  return `T${item.temporadaNumero} · E${item.episodioNumero}`;
}

export function HomeContinuarAssistindo({ historico, itens }: Props) {
  // `flatMap` e não `map` + `filter`: a linha do histórico pode apontar para
  // um slug que saiu do acervo, e aí ela some da lista em vez de virar um
  // card sem capa nem nome.
  const emAndamento = historico.flatMap((item) => {
    const midia = itens.find((m) => m.slug === item.midiaSlug);
    return midia ? [{ item, midia }] : [];
  });

  // Quem nunca começou nada não precisa ver uma faixa vazia.
  if (emAndamento.length === 0) return null;

  return (
    <section aria-labelledby="continuar" className="mb-14">
      <h2 id="continuar" className="mb-5 text-xl font-semibold">
        Continuar assistindo
      </h2>

      <ul className="grid gap-4 sm:grid-cols-2">
        {emAndamento.map(({ item, midia }) => {
          const percentual = percentualAssistido(item, midia);
          const episodio = rotuloDoEpisodio(item);

          return (
            <li
              key={item.midiaSlug}
              className="flex gap-4 rounded-lg border border-white/10 bg-zinc-900/40 p-3"
            >
              <Image
                // Mesma regra do card: a API OMITE `posterUrl` quando não há
                // capa. Ver o comentário em components/card-midia.tsx.
                src={midia.posterUrl ?? "/capas/sem-capa.svg"}
                alt=""
                width={300}
                height={450}
                className="h-24 w-16 shrink-0 rounded-md border border-white/10 object-cover"
              />

              <div className="min-w-0 flex-1">
                <h3 className="truncate font-medium">{midia.titulo}</h3>
                {episodio && (
                  <p className="mt-0.5 text-sm text-zinc-500">{episodio}</p>
                )}

                {/*
                  `role="progressbar"` numa <div>: não é <progress> porque a
                  estilização do elemento nativo muda de navegador para
                  navegador, e a barra precisa combinar com o resto da faixa.
                */}
                <div
                  role="progressbar"
                  aria-label={`Progresso de ${midia.titulo}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={percentual}
                  className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"
                >
                  <div
                    className="h-full rounded-full bg-violet-500"
                    style={{ width: `${percentual}%` }}
                  />
                </div>

                <p className="mt-1.5 text-xs text-zinc-500">
                  {percentual}% assistido
                </p>

                <button
                  type="button"
                  className="mt-3 rounded-full border border-white/15 px-3 py-1 text-sm font-medium transition hover:border-violet-500 hover:text-violet-300"
                >
                  Retomar
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
