import { Suspense } from "react";
import { AcervoGrade } from "@/components/acervo-grade";
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

      {/*
        O histórico é da pessoa e chega pelo navegador (LP-414). O filtro lê a
        URL com `useSearchParams`, e a home é pré-gerada: no build não existe
        query. Sem esta fronteira, o Next desiste do HTML até a `Suspense` mais
        próxima — a do `loading.tsx`, que cobre a home inteira (LP-502). Com
        ela, só o acervo espera o navegador, e o HTML leva a grade sem filtro,
        que é o que vê quem chega sem `?nao-vistos`.
      */}
      <Suspense fallback={<AcervoGrade itens={itens} />}>
        <AcervoFiltravelDaPessoa itens={itens} />
      </Suspense>
    </section>
  );
}
