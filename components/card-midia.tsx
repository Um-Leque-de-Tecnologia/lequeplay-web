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
    // <article> porque o card faz sentido sozinho, fora da lista.
    <article className="group">
      <Link href={`/midias/${midia.slug}`} className="block">
        <Image
          src={midia.capaUrl}
          alt=""
          width={300}
          height={450}
          // width/height evitam a página "pular" quando a imagem carrega.
          className="w-full rounded-lg border border-white/10 transition group-hover:border-violet-500"
        />

        <h3 className="mt-3 font-medium leading-snug group-hover:text-violet-300">
          {midia.titulo}
        </h3>
      </Link>

      <p className="mt-1 text-sm text-zinc-500">
        {ROTULO_TIPO[midia.tipo]} · {midia.ano}
        {/*
          `??` e não `||`: nota 0 é um valor válido, e `||` a trocaria pelo
          texto de "sem avaliação". Aqui `null` significa "ninguém avaliou".
        */}
        {midia.notaMedia !== null && ` · ★ ${midia.notaMedia.toFixed(1)}`}
      </p>
    </article>
  );
}
