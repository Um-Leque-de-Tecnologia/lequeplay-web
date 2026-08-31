/**
 * O botão flutuante que devolve a pessoa ao começo da página.
 *
 * Ele existe porque o catálogo é uma grade longa: quem desce até o fim
 * ficaria rolando de volta no dedo. Fica `fixed` no canto inferior direito,
 * fora do fluxo, para não empurrar o rodapé.
 */
export function RodapeVoltarAoTopo() {
  return (
    <button
      type="button"
      aria-label="Voltar ao topo"
      title="Voltar ao topo"
      className="fixed bottom-6 right-6 z-40 rounded-full border border-white/10 bg-zinc-900/90 p-3 text-zinc-300 shadow-lg transition hover:border-violet-500 hover:text-zinc-100"
    >
      <span aria-hidden="true">↑</span>
    </button>
  );
}
