"use client";

import type { KeyboardEvent } from "react";
import { useState } from "react";
import { CardMidia } from "@/components/card-midia";
import type { Midia } from "@/lib/tipos";

/**
 * O carrossel de destaques da home.
 *
 * Ele recebe os destaques prontos, por props: quem busca é a página, no
 * servidor. Um carrossel é enfeite de apresentação — não é motivo para
 * arrastar a chamada da API para o navegador.
 */
export function HomeCarrosselDestaques({ destaques }: { destaques: Midia[] }) {
  const [indiceAtual, setIndiceAtual] = useState(0);
  const ultimoIndice = destaques.length - 1;

  function irParaAnterior() {
    setIndiceAtual((indice) => (indice === 0 ? ultimoIndice : indice - 1));
  }

  function irParaProximo() {
    setIndiceAtual((indice) => (indice === ultimoIndice ? 0 : indice + 1));
  }

  if (destaques.length === 0) return null;

  // O foco fica na section: ela tem anel visível e o `aria-live` anuncia o
  // destaque novo. Mandar o foco para um botão faria a próxima seta cair no
  // `return` abaixo — o alvo passaria a ser o botão, não a section.
  function aoPressionarTecla(event: KeyboardEvent<HTMLElement>) {
    if (event.target !== event.currentTarget) return;

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      irParaAnterior();
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      irParaProximo();
    }
  }

  return (
    <section
      aria-labelledby="destaques"
      aria-roledescription="carrossel"
      tabIndex={0}
      onKeyDown={aoPressionarTecla}
      className="mb-14 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-400"
    >
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 id="destaques" className="text-xl font-semibold">
          Em destaque
        </h2>

        <div className="flex gap-2">
          <button
            type="button"
            aria-label="Destaque anterior"
            onClick={irParaAnterior}
            className="rounded-full border border-white/15 px-3 py-1 text-sm transition hover:border-violet-500 hover:text-violet-300"
          >
            ←
          </button>
          <button
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
        {/*
          Continua sendo <ul> porque continua sendo uma lista — o leitor de
          tela anuncia quantos itens existem, mesmo com a faixa se movendo.

          A largura do slide mora só em `--largura-slide`: o <li> usa ela, e
          cada índice anda um slide mais o `gap-6` (1.5rem).
        */}
        <ul
          className="flex gap-6 pb-2 transition-transform duration-300 ease-out motion-reduce:transition-none [--largura-slide:11rem] sm:[--largura-slide:13rem]"
          style={{
            transform: `translateX(calc(${indiceAtual} * (var(--largura-slide) + 1.5rem) * -1))`,
          }}
        >
          {destaques.map((midia, indice) => (
            <li
              key={midia.id}
              className="w-[var(--largura-slide)] shrink-0"
              aria-current={indice === indiceAtual ? "true" : undefined}
            >
              <CardMidia midia={midia} />
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-3 text-sm text-zinc-500" aria-live="polite">
        {indiceAtual + 1} de {destaques.length}:{" "}
        {destaques[indiceAtual].titulo}
      </p>
    </section>
  );
}
