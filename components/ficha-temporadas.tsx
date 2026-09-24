"use client";

import Link from "next/link";
import { useState } from "react";
import { formatarDuracao, rotuloDaTemporada } from "@/lib/formatadores";
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
  // Só o detalhe traz `temporadas` (LP-212). Sem a lista, não há seletor —
  // o `if (!temporada)` lá embaixo devolve `null`.
  const temporadas = serie.temporadas ?? [];

  const indiceEncontrado =
    temporadaNumero !== undefined
      ? temporadas.findIndex(
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

  /*
   * `useState` lê o valor inicial UMA vez, na montagem. Se a página for
   * aberta de novo na mesma rota com outra query — navegação suave, sem
   * remontar —, o seletor continuaria na temporada antiga enquanto o episódio
   * destacado já seria de outra: dois pedaços da mesma tela dizendo coisas
   * diferentes.
   *
   * O ajuste é feito durante a renderização, comparando a prop com o valor
   * anterior. É o que o React recomenda no lugar de um `useEffect` de
   * sincronia: não há segunda renderização pintada na tela, e não há efeito
   * para esquecer de limpar.
   */
  const [
    temporadaDaUrl,
    setTemporadaDaUrl,
  ] = useState(temporadaNumero);

  if (temporadaDaUrl !== temporadaNumero) {
    setTemporadaDaUrl(temporadaNumero);
    setTemporadaSelecionada(indiceInicial);
  }

  const temporada =
    temporadas[temporadaSelecionada];

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
          {temporadas.map((temporada, indice) => (
            <option
              key={temporada.numero}
              value={indice}
            >
              {/* Sem ano, os parênteses somem junto: nada de "Temporada 4 ()". */}
              {temporada.ano
                ? `${rotuloDaTemporada(temporada)} (${temporada.ano})`
                : rotuloDaTemporada(temporada)}
            </option>
          ))}
        </select>

        {/*
          O seletor troca a temporada aqui mesmo, sem sair da ficha; o link
          leva ao endereço próprio da temporada (LP-301), que é o que se
          compartilha e o que abre numa aba nova.
        */}
        <Link
          href={`/midias/${serie.slug}/temporada/${temporada.numero}`}
          className="text-sm font-medium text-violet-400 transition hover:text-violet-300"
        >
          Ver a página desta temporada
        </Link>
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
                  {formatarDuracao(episodio.duracaoMin)}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}