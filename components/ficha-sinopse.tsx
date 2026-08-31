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

export function FichaSinopse({ midia }: { midia: Midia }) {
  const inicio = midia.sinopse.slice(0, CARACTERES_NO_RESUMO);
  const resto = midia.sinopse.slice(CARACTERES_NO_RESUMO);

  /** O resumo está aberto ou ainda cortado. */
  const expandida = false;

  return (
    <div className="mt-5 max-w-prose">
      <p className="text-zinc-300">
        {inicio}
        <span hidden={!expandida}>{resto}</span>
        {/* As reticências são do corte, não da sinopse: somem quando abre. */}
        {resto !== "" && <span hidden={expandida}>…</span>}
      </p>

      {/* Sinopse que coube inteira não ganha botão: não há o que abrir. */}
      {resto !== "" && (
        <button
          type="button"
          aria-expanded={expandida}
          className="mt-2 text-sm font-medium text-violet-400 transition hover:text-violet-300"
        >
          {expandida ? "ver menos" : "ver mais"}
        </button>
      )}
    </div>
  );
}
