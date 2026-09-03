"use client"; // 1. Precisamos disso para usar estados no Next.js

import { useState } from "react"; // 2. Importar o hook de estado
import type { Serie } from "@/lib/tipos";

export function FichaTemporadas({ serie }: { serie: Serie }) {
  // 3. Criar o estado. Começamos com o índice 0 (primeira temporada)
  const [indiceSelecionado, setIndiceSelecionado] = useState(0);

  // 4. A temporada exibida agora depende do estado 'indiceSelecionado'
  const temporada = serie.temporadas[indiceSelecionado];

  return (
    <section aria-labelledby="temporadas" className="mt-12">
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <h2 id="temporadas" className="text-xl font-semibold">
          Episódios
        </h2>

        <label htmlFor="temporada" className="sr-only">
          Escolher temporada
        </label>
        <select
          id="temporada"
          name="temporada"
          value={indiceSelecionado} // Vincula o valor ao estado
          onChange={(e) => setIndiceSelecionado(Number(e.target.value))} // 5. Atualiza o estado ao mudar
          className="rounded-md border border-white/15 bg-zinc-900 px-3 py-1.5 text-sm"
        >
          {serie.temporadas.map((t, indice) => (
            <option key={t.numero} value={indice}>
              Temporada {t.numero} ({t.ano}) 
            </option>
          ))}
        </select>
      </div>

      {/* O resto do código permanece igual, usando a variável 'temporada' que agora é dinâmica */}
      {temporada.episodios.length === 0 ? (
        <p className="text-sm text-zinc-500">
          Os episódios desta temporada ainda não foram anunciados.
        </p>
      ) : (
        <ol className="divide-y divide-white/10 border-y border-white/10">
          {temporada.episodios.map((ep) => (
            <li
              key={ep.numero}
              className="flex flex-wrap items-baseline gap-x-3 py-3 text-sm"
            >
              <span className="w-6 shrink-0 text-zinc-500">{ep.numero}</span>
              <span className="text-zinc-200">{ep.titulo}</span>
              <span className="ml-auto text-zinc-500">{ep.duracaoMin} min</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}