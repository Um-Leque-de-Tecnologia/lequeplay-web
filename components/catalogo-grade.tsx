"use client";

import { useMemo, useState } from "react";
import { CardMidia } from "@/components/card-midia";
import {
  CatalogoOrdenacao,
  type OrdemCatalogo,
} from "@/components/catalogo-ordenacao";
import { CatalogoVazio } from "@/components/catalogo-vazio";
import type { Midia } from "@/lib/tipos";

type Props = {
  itens: Midia[];
};

export function CatalogoGrade({ itens }: Props) {
  const [ordem, setOrdem] = useState<OrdemCatalogo>("relevancia");

  const itensOrdenados = useMemo(() => {
    switch (ordem) {
      case "recentes":
        // Mais novos primeiro. Se empatar no ano, mantém a ordem original.
        return itens.toSorted((a, b) => b.ano - a.ano);
      case "nota":
        // Maiores notas primeiro.
        return itens.toSorted((a, b) => b.notaMedia - a.notaMedia);
      case "az":
        // `localeCompare` com "pt-BR" para respeitar a ordenação correta de
        // acentos no português, e não o código UTF-16 cru.
        return itens.toSorted((a, b) =>
          a.titulo.localeCompare(b.titulo, "pt-BR"),
        );
      case "relevancia":
      default:
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
        <CatalogoOrdenacao ordem={ordem} aoMudarOrdem={setOrdem} />
      </div>

      {itensOrdenados.length === 0 ? (
        <CatalogoVazio />
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
