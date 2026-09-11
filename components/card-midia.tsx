import Image from "next/image";
import Link from "next/link";
import type { Midia } from "@/lib/tipos";

const ROTULO_TIPO: Record<Midia["tipo"], string> = {
  filme: "Filme",
  serie: "Série",
  podcast: "Podcast",
};

export function CardMidia({ midia }: { midia: Midia }) {
  return (
    <article className="group">
      <Link href={`/midias/${midia.slug}`} className="block">
        {midia.posterUrl ? (
          <Image
            src={midia.posterUrl}
            alt=""
            width={300}
            height={450}
            className="w-full rounded-lg border border-white/10 transition group-hover:border-violet-500"
          />
        ) : (
          <Image
            src="/capas/sem-capa.svg"
            alt={`Sem pôster para ${midia.titulo}`}
            width={300}
            height={450}
            className="w-full rounded-lg border border-white/10 object-cover transition group-hover:border-violet-500"
          />
        )}

        <h3 className="mt-3 font-medium leading-snug group-hover:text-violet-300">
          {midia.titulo}
        </h3>
      </Link>

      <p className="mt-1 text-sm text-zinc-500">
        {ROTULO_TIPO[midia.tipo]} · {midia.ano}

        {midia.totalAvaliacoes > 0 && ` · ★ ${midia.notaMedia.toFixed(1)}`}
      </p>
    </article>
  );
}