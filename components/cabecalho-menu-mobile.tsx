import Link from "next/link";

/**
 * Os mesmos destinos da navegação principal, empilhados. A lista mora aqui
 * porque o menu do celular é o único que a usa hoje; no dia em que o
 * cabeçalho de desktop também precisar dela, ela sobe um nível — não antes.
 */
const ITENS = [
  { href: "/", rotulo: "Início" },
  { href: "/midias", rotulo: "Catálogo" },
  { href: "/", rotulo: "Início" },
];

/**
 * A navegação de largura de celular.
 *
 * `<details>` e não uma div com classe: o abrir e fechar é do navegador,
 * chega com teclado e com leitor de tela de graça, e continua funcionando
 * antes do JavaScript carregar. O `sm:hidden` some com tudo no desktop,
 * onde a navegação principal já aparece inteira.
 */
export function CabecalhoMenuMobile() {
  return (
    <details className="relative sm:hidden">
      <summary
        aria-label="Abrir o menu"
        className="cursor-pointer list-none rounded-md p-2 text-zinc-400 transition hover:bg-white/5 hover:text-zinc-100 [&::-webkit-details-marker]:hidden"
      >
        <span aria-hidden="true">☰</span>
      </summary>

      <nav
        aria-label="Menu do celular"
        className="absolute left-0 top-full z-40 mt-2 w-52 rounded-lg border border-white/10 bg-zinc-900 p-2 shadow-lg"
      >
        <div className="flex justify-end">
          <button
            type="button"
            aria-label="Fechar o menu"
            className="rounded-md p-1.5 text-zinc-500 transition hover:bg-white/5 hover:text-zinc-100"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>

        <ul className="flex flex-col">
          {ITENS.map((item, indice) => (
            // Índice como chave porque a lista é fixa: ela não reordena,
            // não cresce e não some no meio da vida da tela.
            <li key={indice}>
              <Link
                href={item.href}
                className="block rounded-md px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/5 hover:text-zinc-100"
              >
                {item.rotulo}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </details>
  );
}
