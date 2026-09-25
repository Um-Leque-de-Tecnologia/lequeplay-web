"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { rotuloDaTemporada } from "@/lib/formatadores";
import type { ResumoTemporada } from "@/lib/tipos";

type Props = {
  slug: string;
  /**
   * Só número e nome: o que um Server Component passa a um Client Component
   * é serializado e viaja no HTML. Com a temporada inteira, a lista de
   * episódios de todas as temporadas iria junto, para desenhar um rótulo.
   */
  temporadas: Pick<ResumoTemporada, "numero" | "nome">[];
};

/**
 * As abas de temporada, no layout das temporadas (LP-302).
 *
 * Client por um motivo só: saber qual aba está ativa. O layout não recebe o
 * `[numero]` — ele vê os params do próprio segmento, e o número é do filho.
 * `useSelectedLayoutSegment` lê, no navegador, o segmento ativo logo abaixo
 * do layout, e continua certo a cada navegação, sem o layout remontar.
 */
export function AbasDeTemporada({ slug, temporadas }: Props) {
  const ativa = useSelectedLayoutSegment();

  return (
    <nav aria-label="Temporadas" className="mt-10">
      <ul className="flex flex-wrap gap-2">
        {temporadas.map((temporada) => {
          const atual = String(temporada.numero) === ativa;

          return (
            <li key={temporada.numero}>
              <Link
                href={`/midias/${slug}/temporada/${temporada.numero}`}
                aria-current={atual ? "page" : undefined}
                className={`inline-block rounded-full border px-3 py-1.5 text-sm transition ${
                  atual
                    ? "border-violet-500 bg-violet-600/20 font-medium text-violet-200"
                    : "border-white/15 text-zinc-300 hover:border-violet-500 hover:text-zinc-100"
                }`}
              >
                {rotuloDaTemporada(temporada)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
