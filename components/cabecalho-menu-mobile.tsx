import Link from "next/link";
import { CabecalhoMenuMobileCasca } from "@/components/cabecalho-menu-mobile-casca";

/**
 * Os mesmos destinos da navegação principal, empilhados. A lista mora aqui
 * porque o menu do celular é o único que a usa hoje; no dia em que o
 * cabeçalho de desktop também precisar dela, ela sobe um nível — não antes.
 */
const ITENS = [
  { href: "/", rotulo: "Início" },
  { href: "/midias", rotulo: "Catálogo" },
];

/**
 * A navegação de largura de celular.
 *
 * `<details>` e não uma div com classe: o abrir e fechar é do navegador,
 * chega com teclado e com leitor de tela de graça, e continua funcionando
 * antes do JavaScript carregar. O `sm:hidden` da casca some com tudo no
 * desktop, onde a navegação principal já aparece inteira.
 *
 * O JavaScript da casca é acréscimo em cima desse comportamento, não
 * substituto: ele só fecha o menu nos casos em que o navegador sozinho não
 * fecharia, mexendo no `open` do próprio `<details>`. Trocar por uma div com
 * `useState` jogaria fora o que o `<details>` dá de graça.
 *
 * Este arquivo continua de servidor de propósito: a lista e os links saem
 * prontos daqui, e só a casca vai para o navegador.
 */
export function CabecalhoMenuMobile() {
  return (
    <CabecalhoMenuMobileCasca>
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
            data-fecha-menu
            className="rounded-md p-1.5 text-zinc-500 transition hover:bg-white/5 hover:text-zinc-100"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>

        <ul className="flex flex-col">
          {ITENS.map((item) => (
            // `href` como chave porque cada destino aparece uma vez só: a
            // chave fica presa ao dado, e não à posição dele na lista.
            <li key={item.href}>
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
    </CabecalhoMenuMobileCasca>
  );
}
