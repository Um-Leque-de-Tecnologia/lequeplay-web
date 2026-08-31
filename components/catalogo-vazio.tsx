/**
 * O que a grade mostra quando a combinação de busca e filtros não devolve
 * nada. Busca sem resultado não é erro: é um resultado de tamanho zero, e a
 * tela precisa dizer isso e oferecer a saída.
 */
export function CatalogoVazio() {
  return (
    <div className="mt-10 rounded-lg border border-dashed border-white/15 p-10 text-center">
      <p className="text-zinc-400">Nenhum item encontrado.</p>

      {/* A saída do beco: quem não achou nada quase sempre quer voltar ao
          catálogo inteiro, não refazer a busca campo por campo. */}
      <button
        type="button"
        className="mt-4 rounded-md border border-white/15 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-violet-500 hover:text-zinc-100"
      >
        limpar filtros
      </button>
    </div>
  );
}
