"use client"; // este arquivo é client: tem estado e handlers

import { useState } from "react";
import { CardMidia } from "@/components/card-midia";
import type { Midia, ItemHistorico } from "@/lib/tipos";

export function AcervoFiltravel({
  itens,
  historico = [],
}: {
  itens: Midia[];
  historico?: ItemHistorico[];
}) {
  const [soNaoVistos, setSoNaoVistos] = useState(false);

  // Quem já foi visto vem no histórico: comparamos pelo slug.
  const jaVistos = new Set(historico.map((h) => h.midiaSlug));
  const naoVistos = itens.filter((m) => !jaVistos.has(m.slug));

  const visiveis = soNaoVistos ? naoVistos : itens;

  return (
    <section aria-labelledby="acervo">
      <div className="mb-6">
        <label className="inline-flex items-center gap-2 text-sm text-zinc-400">
          <input
            type="checkbox"
            name="nao-vistos"
            className="size-4 accent-violet-600"
            checked={soNaoVistos}
            onChange={() => setSoNaoVistos((s) => !s)}
          />
          Só o que eu ainda não vi ({naoVistos.length})
        </label>
      </div>

      <ul className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
        {visiveis.map((midia) => (
          <li key={midia.id}>
            <CardMidia midia={midia} />
          </li>
        ))}
      </ul>
    </section>
  );
}