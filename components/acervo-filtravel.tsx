"use client"; // este arquivo é client: tem estado e handlers

import { useState } from "react";
import { CardMidia } from "@/components/card-midia";
import type { ItemHistorico, Midia } from "@/lib/tipos";

type Props = {
  itens: Midia[];
  historico: ItemHistorico[];
};

// A menor fatia que precisa de estado: o toggle e a grade que ele filtra. O
// título e o contador ficam no `HomeAcervo`, que continua no servidor.
export function AcervoFiltravel({ itens, historico }: Props) {
  const [soNaoVistos, setSoNaoVistos] = useState(false);

  // `Set` e não `array`: a pergunta é "esse slug está aqui?", e ela é feita
  // uma vez por título do acervo.
  const jaComecados = new Set(historico.map((h) => h.midiaSlug));

  // O recorte do filtro: o que sobra depois de tirar o que já foi aberto.
  const naoVistos = itens.filter((midia) => !jaComecados.has(midia.slug));

  const visiveis = soNaoVistos ? naoVistos : itens;

  return (
    <>
      {/*
        <label> envolvendo o campo: o texto inteiro vira área de clique, sem
        precisar casar `id` com `htmlFor`.
      */}
      <div className="mb-6">
        <label className="inline-flex items-center gap-2 text-sm text-zinc-400">
          <input
            type="checkbox"
            name="nao-vistos"
            className="size-4 accent-violet-600"
            checked={soNaoVistos}
            onChange={(e) => setSoNaoVistos(e.target.checked)}
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
    </>
  );
}
