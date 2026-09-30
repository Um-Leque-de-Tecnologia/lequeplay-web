"use client";

import { useMemo, type ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { CardMidia } from "@/components/card-midia";
import {
  CatalogoOrdenacao,
  ORDENS,
  lerOrdem,
  type OrdemCatalogo,
} from "@/components/catalogo-ordenacao";
import type { Midia } from "@/lib/tipos";

/**
 * O critério da ordem em que os itens chegaram da API: popularidade na
 * listagem (`GET /v1/midias`), relevância na busca (`GET /v1/busca`, pelo
 * `rank`).
 */
export type OrdemDaApi = "popularidade" | "relevancia";

type Props = {
  itens: Midia[];
  /**
   * O que mostrar quando não há itens, já montado pela página. Chega pronto,
   * e não importado aqui, para o estado vazio continuar Server Component:
   * o que um arquivo client importa vai junto para o navegador; o que ele
   * recebe por prop, não.
   */
  vazio: ReactNode;
  /**
   * Se `itens` é o resultado **inteiro**, e não uma página dele.
   *
   * Ordenar aqui só é exato quando é: "A-Z" em cima de uma página põe em
   * ordem alfabética os mais populares, e não os primeiros do alfabeto. A
   * API ainda não ordena por nada além de popularidade
   * (docs/ordenacao-catalogo.md), então, sem o resultado inteiro, a única
   * ordem que a tela pode prometer é a que a API mandou.
   */
  resultadoCompleto: boolean;
  /**
   * Em que ordem os itens chegaram — é a ordem que a tela mostra quando não
   * pode oferecer outra. Muda só a frase: "Mais populares primeiro" em cima
   * de uma busca descreveria uma ordem que ninguém aplicou.
   */
  ordemDaApi: OrdemDaApi;
};

export function CatalogoGrade({
  itens,
  vazio,
  resultadoCompleto,
  ordemDaApi,
}: Props) {
  // A ordem mora na URL, e não em `useState`: `?ordem=az` volta igual quando
  // a pessoa recarrega e vai junto no link compartilhado.
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ordemPedida = lerOrdem(searchParams.get("ordem"));

  // Um link com `?ordem=az` pode chegar numa busca que não cabe numa página.
  // A tela não finge atender: mostra a ordem da API e diz por quê.
  const ordem = resultadoCompleto ? ordemPedida : "populares";
  const ordemRecusada =
    ordemPedida !== ordem
      ? ORDENS.find((item) => item.valor === ordemPedida)?.rotulo
      : undefined;

  function mudarOrdem(novaOrdem: OrdemCatalogo) {
    // Parte da query atual para não perder `tipo` e `q` no caminho.
    const params = new URLSearchParams(searchParams.toString());

    // Populares é o padrão: sem `?ordem=`, a URL fica limpa.
    if (novaOrdem === "populares") {
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
        // Sem ano (o contrato permite), o título vai para o fim: subtrair
        // `undefined` daria NaN, e o `sort` com NaN embaralha a lista inteira.
        return itens.toSorted((a, b) => (b.ano ?? -Infinity) - (a.ano ?? -Infinity) || 0);
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
      case "populares":
        // A ordem em que a API mandou: popularidade decrescente na
        // listagem, relevância na busca (`ordemDaApi`).
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
        {resultadoCompleto ? (
          <CatalogoOrdenacao ordem={ordem} aoMudarOrdem={mudarOrdem} />
        ) : (
          // Sem menu, e não um menu de uma opção só: escolher entre nada
          // é ruído. A frase diz a ordem que está valendo.
          <p className="text-sm text-zinc-400">
            {ordemDaApi === "relevancia"
              ? "Mais relevantes primeiro"
              : "Mais populares primeiro"}
          </p>
        )}
      </div>

      {ordemRecusada && (
        <p className="mt-2 text-sm text-zinc-500">
          {/* Buscar não destrava mais a ordem (LP-607): a busca devolve os
              primeiros de um ranking, e não o resultado inteiro. */}
          {ordemDaApi === "relevancia"
            ? `Na busca, a ordem “${ordemRecusada}” não se aplica: os títulos vêm do mais ao menos relevante.`
            : `A ordem “${ordemRecusada}” só está disponível quando todos os resultados cabem em uma página. Filtre por tipo para usá-la.`}
        </p>
      )}

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
