import Link from "next/link";
import { CapaMidia } from "@/components/capa-midia";
import { notaFormatada, temAvaliacoes } from "@/lib/avaliacao";
import type { Midia } from "@/lib/tipos";

const ROTULO_TIPO: Record<Midia["tipo"], string> = {
  filme: "Filme",
  serie: "Série",
  podcast: "Podcast",
};

export function CardMidia({ midia }: { midia: Midia }) {
  return (
    // <article> porque o card faz sentido sozinho, fora da lista.
    <article className="group">
      <Link href={`/midias/${midia.slug}`} scroll={false} className="block">
        <CapaMidia
          posterUrl={midia.posterUrl}
          className="w-full rounded-lg border border-white/10 transition group-hover:border-violet-500"
        />

        <h3 className="mt-3 font-medium leading-snug group-hover:text-violet-300">
          {midia.titulo}
        </h3>
      </Link>

      <p className="mt-1 text-sm text-zinc-500">
        {ROTULO_TIPO[midia.tipo]} · {midia.ano} ·{" "}
        {/* Sem nota não é nota zero: quem separa os dois é `temAvaliacoes`,
            e o porquê está em lib/avaliacao.ts. Aqui a ausência é dita com
            todas as letras, em vez de a linha simplesmente não aparecer. */}
        {temAvaliacoes(midia) ? (
          <span className="text-amber-400">★ {notaFormatada(midia)}</span>
        ) : (
          <span className="italic">ainda não avaliado</span>
        )}
      </p>
    </article>
  );
}
