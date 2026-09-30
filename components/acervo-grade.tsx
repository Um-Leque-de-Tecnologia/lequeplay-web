import { CardMidia } from "@/components/card-midia";
import type { Midia } from "@/lib/tipos";

/**
 * A grade do acervo, sem filtro.
 *
 * Sem `"use client"` porque serve aos dois lados: o `AcervoFiltravel` a usa
 * no navegador, e o `HomeAcervo` a usa no servidor como `fallback` da
 * `Suspense` — é ela que vai no HTML pré-gerado da home (LP-502).
 */
export function AcervoGrade({ itens }: { itens: Midia[] }) {
  return (
    <ul className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
      {itens.map((midia) => (
        <li key={midia.id}>
          <CardMidia midia={midia} />
        </li>
      ))}
    </ul>
  );
}
