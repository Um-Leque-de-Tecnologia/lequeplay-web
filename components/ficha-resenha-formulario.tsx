"use client";

import { useActionState } from "react";
import {
  publicarResenha,
  type EstadoDaResenha,
} from "@/app/midias/[slug]/acoes";
import { FichaResenhaCampo } from "@/components/ficha-resenha-campo";

const ESTADO_INICIAL: EstadoDaResenha = {};

/**
 * O formulário de publicar resenha.
 *
 * É `<form action={...}>` com Server Action, como o de entrar: **funciona sem
 * JavaScript**. O `useActionState` acrescenta o que só existe com JS — a
 * mensagem sem recarregar, o botão que sabe que está enviando, e o texto de
 * volta quando a publicação falha.
 *
 * O slug viaja num campo escondido porque a action não enxerga a rota de onde
 * foi chamada. Campo escondido é escrito por quem quiser — por isso quem o
 * confere é o servidor, dentro da action, que pergunta ao catálogo se aquele
 * título existe antes de gravar qualquer coisa ou derrubar qualquer etiqueta.
 */
export function FichaResenhaFormulario({
  slug,
  titulo,
}: {
  slug: string;
  titulo: string;
}) {
  const [estado, acao, enviando] = useActionState(
    publicarResenha,
    ESTADO_INICIAL,
  );

  return (
    <form action={acao}>
      <input type="hidden" name="slug" value={slug} />

      {estado.erro && (
        /* `role="alert"` para o leitor de tela anunciar assim que aparece. */
        <p
          role="alert"
          className="mb-3 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200"
        >
          {estado.erro}
        </p>
      )}

      {estado.publicada && (
        /*
          `role="status"`, e não `alert`: publicar deu certo, e interromper o
          que o leitor de tela estiver lendo para dar boa notícia é rude.
        */
        <p
          role="status"
          className="mb-3 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200"
        >
          Resenha publicada.
        </p>
      )}

      <label htmlFor="texto" className="block text-sm text-zinc-400">
        O que você achou de {titulo}?
      </label>

      {/* O texto digitado volta depois do erro, para ninguém reescrever. */}
      <FichaResenhaCampo textoInicial={estado.texto} />

      <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex items-center gap-2">
          <label htmlFor="nota" className="text-sm text-zinc-400">
            Nota
          </label>
          {/*
            `<select>` e não campo numérico: a nota vai de 0 a 10, inteira, e
            uma lista fechada não deixa digitar 11 nem 7,5. A opção vazia é a
            primeira e é o padrão — resenhar sem dar nota é permitido, e o
            contrato aceita `nota: null`.
          */}
          <select
            id="nota"
            name="nota"
            defaultValue=""
            className="rounded-md border border-white/15 bg-zinc-900 px-3 py-1.5 text-sm"
          >
            <option value="">sem nota</option>
            {Array.from({ length: 11 }, (_, numero) => (
              <option key={numero} value={numero}>
                {numero}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input
            id="contemSpoiler"
            name="contemSpoiler"
            type="checkbox"
            className="h-4 w-4 rounded border-white/15 bg-zinc-900"
          />
          <label htmlFor="contemSpoiler" className="text-sm text-zinc-400">
            Contém spoiler
          </label>
        </div>
      </div>

      <button
        type="submit"
        disabled={enviando}
        className="mt-4 rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {enviando ? "Publicando…" : "Publicar resenha"}
      </button>
    </form>
  );
}
