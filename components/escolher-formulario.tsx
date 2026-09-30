"use client";

import Link from "next/link";
import { type FormEvent, useActionState, useEffect, useRef, useState } from "react";
import { type EstadoDaRecomendacao, recomendar } from "@/app/escolher/acoes";
import {
  type CandidatoDaRecomendacao,
  type EventoDaRecomendacao,
  type TrechoDaResposta,
  interpretarResposta,
  lerLinhasSSE,
} from "@/lib/recomendacao-comum";

const INICIAL: EstadoDaRecomendacao = { tipo: "inicial" };

/** A resposta sendo lida do `/api/recomendar`, pedaço a pedaço. */
type Leitura = {
  candidatos: CandidatoDaRecomendacao[];
  texto: string;
  erro: string | null;
  terminou: boolean;
};

const LEITURA_NOVA: Leitura = { candidatos: [], texto: "", erro: null, terminou: false };

/**
 * O formulário do `/escolher` e a resposta embaixo dele.
 *
 * Com JavaScript, o envio lê o `/api/recomendar` em pedaços (LP-704): o
 * texto aparece enquanto o modelo escreve, em vez de tudo de uma vez uns
 * segundos depois. O `preventDefault` no `onSubmit` faz o React pular a
 * action do `<form>`.
 *
 * Sem JavaScript, o `<form>` posta para a action como antes (LP-703) e a
 * página volta com a resposta inteira — por isso o `useActionState` fica.
 */
export function EscolherFormulario({ maximo }: { maximo: number }) {
  const [estado, acao, esperandoAction] = useActionState(recomendar, INICIAL);
  const pedidoAnterior = estado.tipo === "inicial" ? "" : estado.pedido;

  const [leitura, setLeitura] = useState<Leitura | null>(null);
  const controladorAtual = useRef<AbortController | null>(null);

  // Saiu da página no meio: para a leitura (e, do lado de lá, o modelo).
  useEffect(() => () => controladorAtual.current?.abort(), []);

  async function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const pedido = new FormData(evento.currentTarget).get("pedido");

    // Um pedido novo cancela o anterior, que ainda podia estar escrevendo.
    controladorAtual.current?.abort();
    const controlador = new AbortController();
    controladorAtual.current = controlador;

    // Pedaço de um pedido que já foi trocado não entra na tela.
    const atualizar = (mudar: (anterior: Leitura) => Leitura) => {
      if (controladorAtual.current === controlador) {
        setLeitura((anterior) => mudar(anterior ?? LEITURA_NOVA));
      }
    };

    setLeitura(LEITURA_NOVA);

    try {
      const resposta = await fetch("/api/recomendar", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pedido }),
        signal: controlador.signal,
      });
      if (!resposta.body) throw new Error("resposta sem corpo");

      // Recusa (4xx/5xx) vem no mesmo formato, com um evento `erro`: o
      // status não precisa de caminho próprio.
      for await (const dado of lerLinhasSSE(resposta.body)) {
        const e = JSON.parse(dado) as EventoDaRecomendacao;

        if (e.type === "candidatos") {
          atualizar((l) => ({ ...l, candidatos: e.data }));
        } else if (e.type === "texto") {
          atualizar((l) => ({ ...l, texto: l.texto + e.data }));
        } else if (e.type === "fim") {
          atualizar((l) => ({ ...l, terminou: true }));
        } else if (e.type === "erro") {
          atualizar((l) => ({ ...l, erro: e.data, terminou: true }));
        }
      }

      // Acabou sem `fim` nem `erro`: a conexão caiu no meio.
      atualizar((l) =>
        l.terminou
          ? l
          : { ...l, erro: "A conexão caiu antes do fim. Tente de novo.", terminou: true },
      );
    } catch {
      if (controlador.signal.aborted) return;
      // O que já chegou fica na tela; o erro vai embaixo, e o botão volta.
      atualizar((l) => ({
        ...l,
        erro: "Não conseguimos falar com o servidor. Tente de novo.",
        terminou: true,
      }));
    }
  }

  const escrevendo = leitura !== null && !leitura.terminou;
  const ocupado = esperandoAction || escrevendo;

  // Uma vista só para os dois caminhos: com JS, a leitura; sem, a action.
  const trechos: TrechoDaResposta[] = leitura
    ? interpretarResposta(leitura.texto, leitura.candidatos)
    : estado.tipo === "resposta"
      ? estado.trechos
      : [];
  const erro = leitura ? leitura.erro : estado.tipo === "erro" ? estado.mensagem : null;

  return (
    <>
      <form
        action={acao}
        onSubmit={aoEnviar}
        className="mt-6 flex max-w-2xl flex-wrap gap-2"
      >
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
          disabled={ocupado}
          className="rounded-md bg-violet-600 px-4 py-2 font-medium text-white transition hover:bg-violet-500 disabled:cursor-wait disabled:bg-violet-600/60"
        >
          {!ocupado ? "Recomendar" : leitura?.texto ? "Escrevendo…" : "Pensando…"}
        </button>
      </form>

      {/* Uma região só para espera, erro e resposta: é ela que o leitor de
          tela acompanha depois do clique. O `aria-busy` enquanto escreve faz
          ele ler o texto pronto, e não cada pedaço que chega. */}
      <section aria-live="polite" aria-busy={ocupado} className="mt-8 max-w-prose">
        {trechos.length > 0 && (
          <>
            {/* `whitespace-pre-line` mantém os parágrafos do modelo sem
                interpretar markdown nem HTML: o texto é do modelo, e texto
                de modelo não entra na página como marcação. */}
            <div className="whitespace-pre-line leading-relaxed text-zinc-200">
              {trechos.map((trecho, i) =>
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
              {escrevendo && (
                <span aria-hidden className="ml-0.5 animate-pulse text-violet-400">
                  ▍
                </span>
              )}
            </div>

            {!escrevendo && (
              <p className="mt-4 text-xs text-zinc-500">
                Recomendação escrita por IA a partir dos títulos que a busca
                encontrou. Pode errar — confira a ficha.
              </p>
            )}
          </>
        )}

        {erro && (
          <p role="alert" className={`text-sm text-red-300 ${trechos.length > 0 ? "mt-4" : ""}`}>
            {erro}
          </p>
        )}
      </section>
    </>
  );
}
