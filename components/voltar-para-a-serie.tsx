"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * O caminho de volta na tela de temporada não encontrada.
 *
 * É componente de cliente por um motivo específico, e não por gosto: o
 * `not-found.tsx` **não recebe `params`**. A documentação desta versão é
 * literal — *"not-found.js components do not accept any props"* — e sem o
 * slug não há série para onde voltar. A mesma página da doc aponta a saída:
 * usar `usePathname` quando a tela precisa depender do endereço.
 *
 * O endereço é `/midias/<slug>/temporada/<numero>`, então o slug é o segundo
 * segmento. Se o formato não bater — e não deveria, porque este arquivo só
 * existe dentro dessa rota —, o link cai no catálogo, em vez de sumir da
 * tela e deixar quem chegou aqui sem saída.
 */
export function VoltarParaASerie() {
  const caminho = usePathname();
  const segmentos = caminho.split("/").filter(Boolean);
  const slug = segmentos[0] === "midias" ? segmentos[1] : undefined;

  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
      <Link
        href={slug ? `/midias/${slug}` : "/midias"}
        className="inline-block rounded-full bg-violet-600 px-5 py-2.5 font-medium text-white transition hover:bg-violet-500"
      >
        {slug ? "Voltar para a série" : "Ir para o catálogo"}
      </Link>

      <Link
        href="/midias"
        className="text-sm text-zinc-400 transition hover:text-zinc-100"
      >
        Ver todo o catálogo
      </Link>
    </div>
  );
}
