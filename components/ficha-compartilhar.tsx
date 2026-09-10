"use client";

import { useState } from "react";

/**
 * O endereço público do site.
 *
 * O link de compartilhar tem que ser **absoluto**: ele sai daqui para fora —
 * colado numa conversa, num e-mail, num post — e `/midias/slug` sozinho não
 * leva a lugar nenhum fora do navegador de quem copiou.
 */
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export function FichaCompartilhar({
  slug,
  titulo,
}: {
  slug: string;
  titulo: string;
}) {
  const [copiado, setCopiado] = useState(false);
  const [erro, setErro] = useState(false);
  const url = `${SITE}/midias/${slug}`;

  async function copiarLink() {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      } else {
        const campoTemporario = document.createElement("textarea");
        campoTemporario.value = url;
        campoTemporario.style.position = "fixed";
        campoTemporario.style.opacity = "0";
        document.body.appendChild(campoTemporario);
        campoTemporario.select();
        document.execCommand("copy");
        campoTemporario.remove();
      }

      setErro(false);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2000);
    } catch {
      setCopiado(false);
      setErro(true);
    }
  }

  return (
    <section aria-labelledby="compartilhar" className="mt-12">
      <h2 id="compartilhar" className="mb-3 text-xl font-semibold">
        Compartilhar
      </h2>

      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="link" className="sr-only">
          Link de {titulo}
        </label>
        {/*
          `readOnly` e não `disabled`: campo desabilitado sai da ordem de
          tabulação e o leitor de tela pula, então quem não usa o botão
          perderia o link. Somente-leitura continua focável e selecionável.
        */}
        <input
          id="link"
          type="text"
          readOnly
          value={url}
          className="min-w-72 flex-1 rounded-md border border-white/15 bg-zinc-900 px-3 py-2 text-sm text-zinc-400"
        />
        <button
          type="button"
          onClick={copiarLink}
          className="rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-500"
        >
          {copiado ? "Link copiado" : erro ? "Nao foi possivel copiar" : "Copiar link"}
        </button>
        <span role="status" aria-live="polite" className="sr-only">
          {copiado
            ? "Link copiado para a area de transferencia."
            : erro
              ? "Nao foi possivel copiar o link."
              : ""}
        </span>
      </div>
    </section>
  );
}
