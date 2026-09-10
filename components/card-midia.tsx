import Image from "next/image";
import Link from "next/link";
import type { Midia } from "@/lib/tipos";

const ROTULO_TIPO: Record<Midia["tipo"], string> = {
  filme: "Filme",
  serie: "Série",
  podcast: "Podcast",
};

export function CardMidia({ midia }: { midia: Midia }) {
  const temAvaliacao =
    typeof midia.totalAvaliacoes === "number" &&
    midia.totalAvaliacoes > 0 &&
    typeof midia.notaMedia === "number" &&
    !Number.isNaN(midia.notaMedia);

  const notaFormatada = temAvaliacao
    ? midia.notaMedia.toLocaleString("pt-BR", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })
    : null;

  return (
    <article className="group">
      <Link href={`/midias/${midia.slug}`} className="block">
        <Image
          src={midia.posterUrl ?? "/capas/sem-capa.svg"}
          alt=""
          width={300}
          height={450}
          className="w-full rounded-lg border border-white/10 transition group-hover:border-violet-500"
        />

        <h3 className="mt-3 font-medium leading-snug group-hover:text-violet-300">
          {midia.titulo}
        </h3>
      </Link>

      <p className="mt-1 text-sm text-zinc-500">
        {ROTULO_TIPO[midia.tipo]} · {midia.ano} ·{" "}
        {temAvaliacao ? (
          <span className="text-amber-400">★ {notaFormatada}</span>
        ) : (
          <span className="text-zinc-500 italic">ainda não avaliado</span>
        )}
      </p>
    </article>
  );
}