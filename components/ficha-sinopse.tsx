"use client";

/**
 * `"use client"` porque o "ver mais" é estado + evento de usuário: abrir e
 * fechar o resumo acontece no navegador, sem nova ida ao servidor.
 */

import { useState } from "react";
import { corte } from "@/lib/utils";

/**
 * Recebe a sinopse, e não a mídia inteira, de propósito: tudo o que um Server
 * Component passa por prop a um Client Component é serializado e viaja no HTML
 * até o navegador. Com a `Midia` inteira, a lista de episódios de um podcast
 * iria junto — mesmo os episódios que a tela cortou para não mandar.
 */
export function FichaSinopse({ sinopse }: { sinopse: string }) {
  const [expandida, setExpandida] = useState(false);

  const ponto = corte(sinopse);
  const inicio = sinopse.slice(0, ponto);
  // O resto começa no próprio espaço (ou na pontuação) do corte: é ele que
  // separa as duas metades quando a sinopse abre. Nenhum espaço é inventado,
  // então o corte no limite cru não parte a palavra em duas ao abrir.
  const resto = sinopse.slice(ponto).trimEnd();

  return (
    <div className="mt-5 max-w-prose">
      <p className="text-zinc-300">
        {inicio}
        {resto !== "" && (
          <>
            <span id="resto-sinopse" hidden={!expandida}>{resto}</span>
            {/* As reticências são do corte, não da sinopse: somem quando abre. */}
            <span hidden={expandida}>…</span>
          </>
        )}
      </p>

      {/* Sinopse que coube inteira não ganha botão: não há o que abrir. */}
      {resto !== "" && (
        <button
          type="button"
          aria-expanded={expandida}
          // Diz ao leitor de tela *o que* está expandido, não só que algo está.
          aria-controls="resto-sinopse"
          onClick={() => setExpandida((v) => !v)}
          className="mt-2 text-sm font-medium text-violet-400 transition hover:text-violet-300"
        >
          {expandida ? "ver menos" : "ver mais"}
        </button>
      )}
    </div>
  );
}
