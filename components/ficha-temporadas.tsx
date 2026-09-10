"use client";

import { useState } from "react";
import type { Serie } from "@/lib/tipos";

type Props = {
  serie: Serie;

  /*
   * Quando a página foi aberta pelo botão "Retomar",
   * esses valores identificam a temporada e o episódio.
   */
  temporadaNumero?: number;
  episodioNumero?: number;
};

export function FichaTemporadas({
  serie,
  temporadaNumero,
  episodioNumero,
}: Props) {
  /*
   * A API identifica uma temporada pelo campo `numero`.
   *
   * O array, entretanto, é acessado pelo índice.
   *
   * Por isso encontramos o índice correspondente
   * ao número recebido na URL.
   */
  const indiceEncontrado =
    temporadaNumero !== undefined
      ? serie.temporadas.findIndex(
          (temporada) =>
            temporada.numero === temporadaNumero,
        )
      : -1;

  /*
   * Se a temporada recebida não existir,
   * começamos pela primeira.
   */
  const indiceInicial =
    indiceEncontrado >= 0
      ? indiceEncontrado
      : 0;

  const [
    temporadaSelecionada,
    setTemporadaSelecionada,
  ] = useState(indiceInicial);

  const temporada =
    serie.temporadas[temporadaSelecionada];

  /*
   * Proteção caso a série não tenha nenhuma temporada.
   */
  if (!temporada) {
    return null;
  }

  /*
   * O episódio que veio pelo "Retomar" só é ESTE episódio se a temporada
   * também for a dele. Comparando só o número, `?temporada=2&episodio=2`
   * destacava o episódio 2 de qualquer temporada que o seletor abrisse —
   * inclusive a 0 de protocolo-aberto, que é a de especiais.
   *
   * A comparação é com `temporada.numero`, e não com o índice do array: nessa
   * mesma série os dois não coincidem.
   */
  const ehOEpisodioDoRetomar = (numeroDoEpisodio: number) =>
    temporadaNumero !== undefined &&
    episodioNumero !== undefined &&
    temporada.numero === temporadaNumero &&
    numeroDoEpisodio === episodioNumero;

  return (
    <section
      aria-labelledby="temporadas"
      className="mt-12"
    >
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <h2
          id="temporadas"
          className="text-xl font-semibold"
        >
          Episódios
        </h2>

        <label
          htmlFor="temporada"
          className="sr-only"
        >
          Escolher temporada
        </label>

        <select
          id="temporada"
          name="temporada"
          value={temporadaSelecionada}
          onChange={(event) => {
            setTemporadaSelecionada(
              Number(event.target.value),
            );
          }}
          className="rounded-md border border-white/15 bg-zinc-900 px-3 py-1.5 text-sm"
        >
          {serie.temporadas.map((temporada, indice) => (
            <option
              key={temporada.numero}
              value={indice}
            >
              Temporada {temporada.numero} (
              {temporada.ano})
            </option>
          ))}
        </select>
      </div>

      {temporada.episodios.length === 0 ? (
        <p className="text-sm text-zinc-500">
          Os episódios desta temporada ainda não foram
          anunciados.
        </p>
      ) : (
        <ol className="divide-y divide-white/10 border-y border-white/10">
          {temporada.episodios.map((episodio) => {
            const selecionado = ehOEpisodioDoRetomar(
              episodio.numero,
            );

            return (
              <li
                key={episodio.numero}
                id={
                  selecionado
                    ? `episodio-${episodio.numero}`
                    : undefined
                }
                className={`flex flex-wrap items-baseline gap-x-3 py-3 text-sm ${
                  selecionado
                    ? "rounded-md bg-violet-500/10 px-2"
                    : ""
                }`}
              >
                <span className="w-6 shrink-0 text-zinc-500">
                  {episodio.numero}
                </span>

                <span
                  className={
                    selecionado
                      ? "font-medium text-violet-300"
                      : "text-zinc-200"
                  }
                >
                  {episodio.titulo}
                </span>

                {selecionado && (
                  <span className="text-xs text-violet-400">
                    Continuar daqui
                  </span>
                )}

                <span className="ml-auto text-zinc-500">
                  {episodio.duracaoMin} min
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}