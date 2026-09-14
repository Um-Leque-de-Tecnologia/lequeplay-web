import { AcervoFiltravel } from "@/components/acervo-filtravel";
import type { ItemHistorico, Midia, MidiaCard } from "@/lib/tipos";

type Props = {
  itens: (Midia | MidiaCard)[];
  /** O `total` da resposta de `listarMidias`, não o tamanho de `itens`. */
  total: number;
  /** Serve ao filtro: quem já apareceu aqui a pessoa já começou a ver. */
  historico: ItemHistorico[];
};

// Continua Server Component: título e contador não têm interação nenhuma, então
// não há por que mandar JavaScript para eles. Só o filtro vira client.
export function HomeAcervo({ itens, total, historico }: Props) {
  return (
    <section aria-labelledby="acervo">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="acervo" className="text-xl font-semibold">
          O acervo
        </h2>
        <p className="text-sm text-zinc-500">
          {total} {total === 1 ? "título" : "títulos"} no acervo
        </p>
      </div>

      <AcervoFiltravel itens={itens} historico={historico} />
    </section>
  );
}
