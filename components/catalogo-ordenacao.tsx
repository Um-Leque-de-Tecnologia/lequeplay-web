"use client";

import { useRef } from "react";

/**
 * O seletor de ordenação do catálogo.
 *
 * Componente folha controlado: recebe a ordem selecionada e notifica
 * o componente pai quando uma nova opção é escolhida.
 */

export type OrdemCatalogo = "relevancia" | "recentes" | "nota" | "az";

type Props = {
  ordem: OrdemCatalogo;
  aoMudarOrdem: (novaOrdem: OrdemCatalogo) => void;
};

// A ordem do array é a ordem do menu. "Relevância" primeiro porque é o
// padrão de quem chega sem pedir nada.
const ORDENS: { valor: OrdemCatalogo; rotulo: string }[] = [
  { valor: "relevancia", rotulo: "Relevância" },
  { valor: "recentes", rotulo: "Mais recentes" },
  { valor: "nota", rotulo: "Melhor avaliados" },
  { valor: "az", rotulo: "A-Z" },
];

export function CatalogoOrdenacao({ ordem, aoMudarOrdem }: Props) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const summaryRef = useRef<HTMLElement>(null);

  const rotuloAtual =
    ORDENS.find((item) => item.valor === ordem)?.rotulo ?? "Relevância";

  function fecharMenu() {
    if (detailsRef.current) {
      detailsRef.current.open = false;
    }
  }

  return (
    // <details> e não um menu montado à mão: abrir e fechar é comportamento
    // nativo, e o teclado já navega nele sem a gente escrever nada.
    <details
      ref={detailsRef}
      className="relative"
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          fecharMenu();
          summaryRef.current?.focus();
        }
      }}
    >
      <summary
        ref={summaryRef}
        className="cursor-pointer list-none rounded-md border border-white/15 px-3 py-2 text-sm text-zinc-300 transition hover:border-violet-500 hover:text-zinc-100 [&::-webkit-details-marker]:hidden"
      >
        Ordenar por: {rotuloAtual}
      </summary>

      <ul className="absolute right-0 z-10 mt-2 w-52 rounded-md border border-white/15 bg-zinc-900 p-1 shadow-lg shadow-black/40">
        {ORDENS.map((item) => {
          const selecionada = item.valor === ordem;

          return (
            <li key={item.valor}>
              <button
                type="button"
                onClick={() => {
                  aoMudarOrdem(item.valor);
                  fecharMenu();
                  summaryRef.current?.focus();
                }}
                className={`w-full rounded px-3 py-2 text-left text-sm transition ${
                  selecionada
                    ? "bg-violet-600/20 font-medium text-violet-300"
                    : "text-zinc-300 hover:bg-white/5 hover:text-zinc-100"
                }`}
              >
                {item.rotulo}
              </button>
            </li>
          );
        })}
      </ul>
    </details>
  );
}
