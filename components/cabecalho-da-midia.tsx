import type { ReactNode } from "react";
import { CapaMidia } from "@/components/capa-midia";
import { FichaSinopse } from "@/components/ficha-sinopse";
import { notaFormatada, temAvaliacoes } from "@/lib/avaliacao";
import type { Midia } from "@/lib/tipos";

/**
 * O cabeçalho de um título: capa, nome, nota e sinopse.
 *
 * Mora aqui, e não dentro da página, porque aparece em dois lugares: na ficha
 * (`app/midias/[slug]/page.tsx`) e no layout das temporadas
 * (`app/midias/[slug]/temporada/layout.tsx`, LP-302). Duas cópias do mesmo
 * cabeçalho seriam duas coisas para manter iguais à mão — e a segunda ia
 * ficar para trás no primeiro ajuste.
 */
export function CabecalhoDaMidia({
  midia,
  children,
}: {
  midia: Midia;
  /**
   * O que vem abaixo da sinopse e só faz sentido na ficha — hoje, o botão de
   * marcar como assistido. Entra por aqui, e não direto no componente,
   * porque o layout das temporadas usa o mesmo cabeçalho e não tem esse botão.
   */
  children?: ReactNode;
}) {
  return (
    <div className="grid gap-8 sm:grid-cols-[240px_1fr]">
      <CapaMidia
        posterUrl={midia.posterUrl}
        className="w-full rounded-lg border border-white/10"
        priority
      />

      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {midia.titulo}
        </h1>

        <p className="mt-2 text-sm text-zinc-500">
          {/* A ficha tem espaço para o convite; o cartão da grade, não.
              A nota, porém, sai da mesma função nos dois lugares. */}
          {temAvaliacoes(midia)
            ? `★ ${notaFormatada(midia)} · ${midia.totalAvaliacoes} avaliações`
            : "Título ainda não avaliado. Seja a primeira pessoa a avaliar."}
        </p>

        {midia.sinopse && <FichaSinopse sinopse={midia.sinopse} />}

        {children}
      </div>
    </div>
  );
}
