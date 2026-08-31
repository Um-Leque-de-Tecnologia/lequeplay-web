/**
 * O seletor de ordenação do catálogo.
 *
 * A ordem é dado da URL, e não estado de tela: `?ordem=recentes` é um
 * endereço que a pessoa compartilha e que volta igual quando ela recarrega.
 */

export type OrdemCatalogo = "relevancia" | "recentes" | "nota" | "az";

// A ordem do array é a ordem do menu. "Relevância" primeiro porque é o
// padrão de quem chega sem pedir nada.
const ORDENS: { valor: OrdemCatalogo; rotulo: string }[] = [
  { valor: "relevancia", rotulo: "Relevância" },
  { valor: "recentes", rotulo: "Mais recentes" },
  { valor: "nota", rotulo: "Melhor avaliados" },
  { valor: "az", rotulo: "A-Z" },
];

export function CatalogoOrdenacao() {
  return (
    // <details> e não um menu montado à mão: abrir e fechar é comportamento
    // nativo, e o teclado já navega nele sem a gente escrever nada.
    <details className="relative">
      <summary className="cursor-pointer list-none rounded-md border border-white/15 px-3 py-2 text-sm text-zinc-300 transition hover:border-violet-500 hover:text-zinc-100 [&::-webkit-details-marker]:hidden">
        Ordenar por: Relevância
      </summary>

      <ul className="absolute right-0 z-10 mt-2 w-52 rounded-md border border-white/15 bg-zinc-900 p-1 shadow-lg shadow-black/40">
        {ORDENS.map((ordem) => (
          <li key={ordem.valor}>
            <button
              type="button"
              className="w-full rounded px-3 py-2 text-left text-sm text-zinc-300 transition hover:bg-white/5 hover:text-zinc-100"
            >
              {ordem.rotulo}
            </button>
          </li>
        ))}
      </ul>
    </details>
  );
}
