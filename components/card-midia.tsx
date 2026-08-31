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
          // `??` e não `||`: o `??` só troca `null`/`undefined`, o `||` troca
          // qualquer valor falso — e `""` vindo da API é dado sujo, não "sem
          // capa"; com `||` o bug viraria uma capa bonitinha e ninguém veria.
          // O campo mudou de `capaUrl: string | null` para `posterUrl?: string`
          // (a API OMITE quando não há capa, em vez de mandar `null`), e o `??`
          // sobreviveu à troca justamente porque ele já pegava `undefined`.
          src={midia.posterUrl ?? "/capas/sem-capa.svg"}
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
          Quem responde "ninguém avaliou" é o CONTADOR, não a nota: a API
          manda `notaMedia` sempre como número, então o `0` de um título sem
          voto nenhum é o mesmo `0` de um título detestado. Só
          `totalAvaliacoes` separa os dois.
        */}
        {midia.totalAvaliacoes > 0 && ` · ★ ${midia.notaMedia.toFixed(1)}`}
      </p>
    </article>
  );
}
