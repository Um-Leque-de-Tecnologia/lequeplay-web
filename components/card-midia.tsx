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
      <Link href={`/midias/${midia.slug}`} className="block">
        <CapaMidia
          posterUrl={midia.posterUrl}
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
        {temAvaliacoes(midia) && ` · ★ ${notaFormatada(midia)}`}
      </p>
    </article>
  );
}