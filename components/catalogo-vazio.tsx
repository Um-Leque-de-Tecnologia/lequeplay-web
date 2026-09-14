import Link from "next/link";
import type { Midia } from "@/lib/tipos";

/**
 * O começo da frase, por tipo. A frase inteira, e não só o nome do tipo:
 * "nenhuma série encontrada" concorda em gênero, e o valor cru da URL
 * (`serie`, sem acento) não é palavra do LequePlay.
 */
const NENHUM: Record<Midia["tipo"], string> = {
  filme: "Nenhum filme encontrado",
  serie: "Nenhuma série encontrada",
  podcast: "Nenhum podcast encontrado",
};

/**
 * O `?tipo=` chega da URL como texto livre. O que não é um dos três tipos
 * vira "título", em vez de a tela repetir um valor que alguém digitou à mão.
 */
function lerTipo(valor: string | undefined): Midia["tipo"] | undefined {
  return valor === "filme" || valor === "serie" || valor === "podcast"
    ? valor
    : undefined;
}

/**
 * O que a grade mostra quando a combinação de busca e filtros não devolve
 * nada. Busca sem resultado não é erro: é um resultado de tamanho zero, e a
 * tela precisa dizer isso e oferecer a saída.
 *
 * Continua Server Component mesmo aparecendo dentro da `CatalogoGrade`, que
 * é client: quem monta este componente é a página, e ele chega pronto à
 * grade pela prop `vazio`. Assim ele não entra no JavaScript do navegador.
 */
export function CatalogoVazio({ q, tipo }: { q?: string; tipo?: string }) {
  const busca = q?.trim();
  const tipoLido = lerTipo(tipo);
  const frase = tipoLido ? NENHUM[tipoLido] : "Nenhum título encontrado";

  // Filtro é o que está na URL, válido ou não: um `?tipo=` inventado também
  // esvazia a grade, e também precisa de saída.
  const temFiltro = Boolean(busca) || Boolean(tipo);

  return (
    <div className="mt-10 rounded-lg border border-dashed border-white/15 p-10 text-center">
      {/* `role="status"` para o leitor de tela anunciar o vazio quando ele
          aparece sem recarregar a página. Só a frase, e não o link junto. */}
      <p role="status" className="text-zinc-300">
        {busca ? `${frase} para “${busca}”.` : `${frase}.`}
      </p>

      {busca && (
        <p className="mt-2 text-sm text-zinc-500">
          Confira se o nome está escrito certo, ou volte ao acervo completo.
        </p>
      )}

      {/* A saída do beco: quem não achou nada quase sempre quer voltar ao
          catálogo inteiro, não refazer a busca campo por campo. É um link, e
          não um botão com `onClick`: os filtros moram na URL, então limpar é
          ir para /midias sem eles — navegação, que funciona até antes do
          JavaScript carregar. Sem filtro nenhum, o link levaria para a mesma
          página, e um botão que não muda nada é o bug deste ticket. */}
      {temFiltro && (
        <Link
          href="/midias"
          className="mt-4 inline-block rounded-md border border-white/15 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-violet-500 hover:text-zinc-100"
        >
          Limpar filtros
        </Link>
      )}
    </div>
  );
}
