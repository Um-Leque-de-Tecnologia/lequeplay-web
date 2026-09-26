import { AcervoFiltravelDaPessoa } from "@/components/historico-da-pessoa";
import type { Midia } from "@/lib/tipos";

type Props = {
  itens: Midia[];
  /** O `total` da resposta de `listarMidias`, não o tamanho de `itens`. */
  total: number;
  /** Serve ao filtro: quem já apareceu aqui a pessoa já começou a ver. */
};

// Continua Server Component: título e contador não têm interação nenhuma, então
// não há por que mandar JavaScript para eles. Só o filtro vira client.
export function HomeAcervo({ itens, total }: Props) {
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

      {/* O histórico é da pessoa e chega pelo navegador (LP-414). */}
      <AcervoFiltravelDaPessoa itens={itens} />
    </section>
  );
}
