"use client";

import { useMemo, type ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { CardMidia } from "@/components/card-midia";
import {
  CatalogoOrdenacao,
  lerOrdem,
  type OrdemCatalogo,
} from "@/components/catalogo-ordenacao";
import type { Midia } from "@/lib/tipos";

type Props = {
  itens: Midia[];
  /**
   * O que mostrar quando não há itens, já montado pela página. Chega pronto,
   * e não importado aqui, para o estado vazio continuar Server Component:
   * o que um arquivo client importa vai junto para o navegador; o que ele
   * recebe por prop, não.
   */
  vazio: ReactNode;
};

export function CatalogoGrade({ itens, vazio }: Props) {
  // A ordem mora na URL, e não em `useState`: `?ordem=az` volta igual quando
  // a pessoa recarrega e vai junto no link compartilhado. A rota é dinâmica,
  // então o servidor já entrega a grade na ordem pedida.
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ordem = lerOrdem(searchParams.get("ordem"));

  function mudarOrdem(novaOrdem: OrdemCatalogo) {
    // Parte da query atual para não perder `tipo` e `q` no caminho.
    const params = new URLSearchParams(searchParams.toString());

    // Relevância é o padrão: sem `?ordem=`, a URL fica limpa.
    if (novaOrdem === "relevancia") {
      params.delete("ordem");
    } else {
      params.set("ordem", novaOrdem);
    }

    const query = params.toString();
    const destino = query ? `${pathname}?${query}` : pathname;

    // `pushState` e não `router.push`: o Next sincroniza o `useSearchParams`
    // sem refazer a página no servidor. Os itens já estão aqui, só a ordem
    // muda — e o "voltar" do navegador desfaz a troca, como num endereço.
    window.history.pushState(null, "", destino);
  }

  const itensOrdenados = useMemo(() => {
    switch (ordem) {
      case "recentes":
        // Mais novos primeiro. Se empatar no ano, mantém a ordem original.
        return itens.toSorted((a, b) => b.ano - a.ano);
      case "nota":
        // Maiores notas primeiro, e quem ninguém avaliou por último: nesses
        // títulos `notaMedia` vem `0` e empataria com uma nota zero de
        // verdade. Quem separa os dois casos é `totalAvaliacoes`.
        return itens.toSorted(
          (a, b) =>
            Number(b.totalAvaliacoes > 0) - Number(a.totalAvaliacoes > 0) ||
            b.notaMedia - a.notaMedia,
        );
      case "az":
        // `localeCompare` com "pt-BR" para respeitar a ordenação correta de
        // acentos no português, e não o código UTF-16 cru.
        return itens.toSorted((a, b) =>
          a.titulo.localeCompare(b.titulo, "pt-BR"),
        );
      case "relevancia":
        // Mantém a ordem original vinda da API/mock sem mutar o array.
        return itens;
    }
  }, [itens, ordem]);

  return (
    <>
      {/* Contagem e ordenação na mesma linha: as duas falam do mesmo
          conjunto de resultados. */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-500" aria-live="polite">
          {itens.length} título(s)
        </p>
        <CatalogoOrdenacao ordem={ordem} aoMudarOrdem={mudarOrdem} />
      </div>

      {itensOrdenados.length === 0 ? (
        vazio
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
          {itensOrdenados.map((midia) => (
            <li key={midia.id}>
              <CardMidia midia={midia} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
