"use client";

/**
 * `"use client"` porque o "ver mais" é estado + evento de usuário: abrir e
 * fechar o resumo acontece no navegador, sem nova ida ao servidor.
 */

import { useState } from "react";
import type { Midia } from "@/lib/tipos";

/**
 * Quantos caracteres da sinopse cabem no resumo antes do "ver mais".
 *
 * É corte de **apresentação**, não de dado: o pedaço que sobra continua no
 * HTML, só que escondido. Cortar no servidor — mandar para o navegador só os
 * primeiros caracteres — economizaria uns bytes e custaria caro: quem busca
 * com Ctrl+F, quem lê com leitor de tela e quem indexa a página passariam a
 * ver meia sinopse. O texto inteiro sai do servidor sempre; o que muda é o
 * que está visível.
 */
const CARACTERES_NO_RESUMO = 180;

/**
 * Onde cortar sem partir palavra: o último espaço até o limite. Se não
 * houver espaço nenhum (palavra gigante, improvável numa sinopse), cai no
 * limite cru — melhor cortar do que não cortar.
 *
 * Pontuação colada no fim do resumo passa para o lado do resto: fechada, a
 * sinopse não termina em `superação,…`; aberta, a vírgula volta ao lugar.
 */
function corte(sinopse: string): number {
  if (sinopse.length <= CARACTERES_NO_RESUMO) return sinopse.length;

  const ultimoEspaco = sinopse.lastIndexOf(" ", CARACTERES_NO_RESUMO);
  if (ultimoEspaco === -1) return CARACTERES_NO_RESUMO;

  const antes = sinopse.charAt(ultimoEspaco - 1);
  return /[,;:]/.test(antes) ? ultimoEspaco - 1 : ultimoEspaco;
}

export function FichaSinopse({ midia }: { midia: Midia }) {
  const [expandida, setExpandida] = useState(false);

  const ponto = corte(midia.sinopse);
  const inicio = midia.sinopse.slice(0, ponto);
  // O resto começa no próprio espaço (ou na pontuação) do corte: é ele que
  // separa as duas metades quando a sinopse abre. Nenhum espaço é inventado,
  // então o corte no limite cru não parte a palavra em duas ao abrir.
  const resto = midia.sinopse.slice(ponto).trimEnd();

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
