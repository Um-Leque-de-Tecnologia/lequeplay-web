"use client";

import type { KeyboardEvent } from "react";
import { useRef, useState } from "react";
import { CardMidia } from "@/components/card-midia";
import type { Midia } from "@/lib/tipos";

export function HomeCarrosselDestaques({ destaques }: { destaques: Midia[] }) {
  const [indiceAtual, setIndiceAtual] = useState(0);
  const botaoAnteriorRef = useRef<HTMLButtonElement>(null);
  const botaoProximoRef = useRef<HTMLButtonElement>(null);
  const ultimoIndice = destaques.length - 1;

  function irParaAnterior() {
    setIndiceAtual((indice) => (indice === 0 ? ultimoIndice : indice - 1));
  }

  function irParaProximo() {
    setIndiceAtual((indice) => (indice === ultimoIndice ? 0 : indice + 1));
  }

  if (destaques.length === 0) return null;

  const slidesEmOrdem = Array.from(
    { length: destaques.length + 2 },
    (_, deslocamento) =>
      destaques[(indiceAtual + deslocamento) % destaques.length],
  );

  function aoPressionarTecla(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      irParaAnterior();
      botaoAnteriorRef.current?.focus();
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      irParaProximo();
      botaoProximoRef.current?.focus();
    }
  }

  return (
    <section
      aria-labelledby="destaques"
      aria-roledescription="carrossel"
      aria-label="Carrossel de destaques"
      tabIndex={0}
      onKeyDown={aoPressionarTecla}
      className="mb-14"
    >
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 id="destaques" className="text-xl font-semibold">
          Em destaque
        </h2>

        <div className="flex gap-2">
          <button
            ref={botaoAnteriorRef}
            type="button"
            aria-label="Destaque anterior"
            onClick={irParaAnterior}
            className="rounded-full border border-white/15 px-3 py-1 text-sm transition hover:border-violet-500 hover:text-violet-300"
          >
            ←
          </button>
          <button
            ref={botaoProximoRef}
            type="button"
            aria-label="Próximo destaque"
            onClick={irParaProximo}
            className="rounded-full border border-white/15 px-3 py-1 text-sm transition hover:border-violet-500 hover:text-violet-300"
          >
            →
          </button>
        </div>
      </div>

      <div className="overflow-hidden">
        <ul className="flex gap-6 pb-2">
          {slidesEmOrdem.map((midia, indice) => (
            <li
              key={`${midia.id}-${indice}`}
              className="w-44 shrink-0 sm:w-52"
              aria-current={indice === 0 ? "true" : undefined}
            >
              <figure>
                <CardMidia midia={midia} />
                <figcaption className="mt-2 text-xs uppercase tracking-wide text-violet-300">
                  {midia.titulo}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-3 text-sm text-zinc-500" aria-live="polite">
        {indiceAtual + 1} de {destaques.length}
      </p>
    </section>
  );
}
