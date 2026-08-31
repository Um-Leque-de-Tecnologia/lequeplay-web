/**
 * A busca do cabeçalho: o mesmo campo do catálogo, alcançável de qualquer
 * página sem precisar voltar para /midias antes.
 *
 * O `action` é um GET para /midias, então quem monta a query string é o
 * próprio navegador — a busca chega na tela como `searchParams.q`, que é
 * de onde o catálogo já lê. Nada de estado aqui para guardar o que foi
 * digitado: o endereço guarda, e endereço se compartilha.
 *
 * Ela abre por um botão, e não fica sempre aberta, porque o cabeçalho é
 * estreito no celular e o campo empurraria a navegação para a segunda linha.
 */
export function CabecalhoBusca() {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label="Abrir a busca"
        aria-expanded={false}
        aria-controls="busca-do-cabecalho"
        className="rounded-md p-2 text-zinc-400 transition hover:bg-white/5 hover:text-zinc-100"
      >
        {/* Ícone é decoração: quem nomeia o botão é o `aria-label`. */}
        <span aria-hidden="true">🔍</span>
      </button>

      <form
        id="busca-do-cabecalho"
        role="search"
        action="/midias"
        className="hidden"
      >
        {/* Placeholder não é label: o campo precisa dos dois. */}
        <label htmlFor="q-cabecalho" className="sr-only">
          Buscar no acervo
        </label>
        <input
          id="q-cabecalho"
          name="q"
          type="search"
          placeholder="Buscar produtos..."
          className="w-48 rounded-md border border-white/15 bg-zinc-900 px-3 py-1.5 text-sm placeholder:text-zinc-600"
        />
      </form>
    </div>
  );
}
