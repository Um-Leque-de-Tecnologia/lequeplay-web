"use client";

import Link from "next/link";
import { useActionState } from "react";
import { type EstadoDaRecomendacao, recomendar } from "@/app/escolher/acoes";

const INICIAL: EstadoDaRecomendacao = { tipo: "inicial" };

/**
 * O formulário do `/escolher` e a resposta embaixo dele.
 *
 * Client só por causa do `useActionState`, que traz a resposta e o estado de
 * espera. Sem JavaScript, o `<form>` posta do mesmo jeito e a página volta
 * com a resposta.
 */
export function EscolherFormulario({ maximo }: { maximo: number }) {
  const [estado, acao, esperando] = useActionState(recomendar, INICIAL);
  const pedidoAnterior = estado.tipo === "inicial" ? "" : estado.pedido;

  return (
    <>
      <form action={acao} className="mt-6 flex max-w-2xl flex-wrap gap-2">
        <label htmlFor="pedido" className="sr-only">
          O que você quer ver?
        </label>
        <input
          id="pedido"
          name="pedido"
          type="text"
          required
          maxLength={maximo}
          // Volta com o pedido depois da resposta: o React limpa o formulário
          // ao fim da action, e perder o que se escreveu num erro é castigo.
          defaultValue={pedidoAnterior}
          placeholder="Ex.: algo leve pra ver com a família"
          className="min-w-64 flex-1 rounded-md border border-white/15 bg-zinc-900 px-3 py-2 text-base placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
        />
        <button
          type="submit"
          disabled={esperando}
          className="rounded-md bg-violet-600 px-4 py-2 font-medium text-white transition hover:bg-violet-500 disabled:cursor-wait disabled:bg-violet-600/60"
        >
          {esperando ? "Pensando…" : "Recomendar"}
        </button>
      </form>

      {/* Uma região só para espera, erro e resposta: é ela que o leitor de
          tela acompanha depois do clique. */}
      <section aria-live="polite" aria-busy={esperando} className="mt-8 max-w-prose">
        {estado.tipo === "erro" && (
          <p role="alert" className="text-sm text-red-300">
            {estado.mensagem}
          </p>
        )}

        {estado.tipo === "resposta" && (
          <>
            {/* `whitespace-pre-line` mantém os parágrafos do modelo sem
                interpretar markdown nem HTML: o texto é do modelo, e texto
                de modelo não entra na página como marcação. */}
            <div className="whitespace-pre-line leading-relaxed text-zinc-200">
              {estado.trechos.map((trecho, i) =>
                trecho.tipo === "texto" ? (
                  <span key={i}>{trecho.texto}</span>
                ) : trecho.tipo === "titulo" ? (
                  <Link
                    key={i}
                    href={`/midias/${trecho.slug}`}
                    className="font-semibold text-violet-300 underline decoration-violet-300/40 underline-offset-2 hover:text-violet-200"
                  >
                    {trecho.titulo}
                  </Link>
                ) : (
                  <span key={i} className="text-zinc-500">
                    (título fora do catálogo)
                  </span>
                ),
              )}
            </div>

            <p className="mt-4 text-xs text-zinc-500">
              Recomendação escrita por IA a partir dos títulos que a busca
              encontrou. Pode errar — confira a ficha.
            </p>
          </>
        )}
      </section>
    </>
  );
}
