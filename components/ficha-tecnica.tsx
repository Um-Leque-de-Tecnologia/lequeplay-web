import { formatarDuracao } from "@/lib/formatadores";
import { obterDiretor } from "@/lib/creditos";
import type { Midia } from "@/lib/tipos";

/**
 * O `status` da série chega da API **em inglês**, como a TMDB publica. A API
 * guarda o dado cru de propósito; virar rótulo em português é decisão de
 * tela, e por isso a tradução mora aqui.
 *
 * O que não estiver no mapa aparece como veio, em vez de sumir: um status
 * novo na origem vira um rótulo estranho na ficha, que alguém nota e corrige
 * — melhor do que uma linha que desaparece em silêncio.
 */
const STATUS_DA_SERIE: Record<string, string> = {
  "Returning Series": "Em exibição",
  Ended: "Encerrada",
  Canceled: "Cancelada",
  "In Production": "Em produção",
  Planned: "Anunciada",
};

/** A ficha muda conforme o tipo — e o narrowing dá o campo certo em cada caso. */
export function FichaTecnica({ midia }: { midia: Midia }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
      <dt className="text-zinc-500">Ano</dt>
      <dd>{midia.ano}</dd>

      <dt className="text-zinc-500">
        {/* O rótulo acompanha a cardinalidade: um gênero, "Gênero". */}
        {midia.generos.length > 1 ? "Gêneros" : "Gênero"}
      </dt>
      {/*
        `generos` é lista, então precisa virar texto. Separador escolhido:
        vírgula e espaço — e não " · ", que o resto da página usa. O ponto
        do meio é invisível para leitor de tela (ele lê "Drama Suspense",
        como se fosse um gênero só de nome comprido); a vírgula é lida como
        pausa e mantém a enumeração audível. Em ficha técnica, a lista
        precisa soar como lista.
      */}
      <dd>{midia.generos.join(", ")}</dd>

      {/*
        A duração pode faltar: a API omite `duracaoMin` quando não tem o
        número — na produção, toda série sem runtime na TMDB vem sem ele.
        Sem esta guarda, `formatarDuracao(undefined)` escreveria "NaNmin"
        na ficha. Some a linha inteira, `dt` junto com `dd`: uma `<dl>` com
        termo sem definição é lida como campo vazio pelo leitor de tela, o
        que é pior do que não anunciar o campo.
      */}
      {midia.duracaoMin !== undefined && (
        <>
          <dt className="text-zinc-500">Duração</dt>
          <dd>{formatarDuracao(midia.duracaoMin)}</dd>
        </>
      )}

      {midia.tipo === "filme" && (
        <>
          <dt className="text-zinc-500">Direção</dt>
          <dd>{obterDiretor(midia)}</dd>
        </>
      )}

      {midia.tipo === "serie" && midia.temporadas && (
        <>
          <dt className="text-zinc-500">
            {/* O rótulo acompanha a cardinalidade, como no gênero acima. */}
            {midia.temporadas.length === 1 ? "Temporada" : "Temporadas"}
          </dt>
          <dd>{midia.temporadas.length}</dd>

          {/*
            O total soma o `totalEpisodios` de cada temporada, e NÃO
            `episodios.length`. O resumo da temporada pode vir sem a lista —
            é o que a API devolve fora do detalhe —, e aí contar o array daria
            um número menor, sem erro nenhum na tela para denunciar.
          */}
          <dt className="text-zinc-500">Episódios</dt>
          <dd>
            {midia.temporadas.reduce(
              (total, temporada) => total + temporada.totalEpisodios,
              0,
            )}
          </dd>

          {/*
            A situação pode faltar, e some a linha inteira quando falta — pelo
            mesmo motivo da duração ali em cima: uma `<dl>` com termo sem
            definição é lida como campo vazio pelo leitor de tela.
          */}
          {midia.status !== undefined && (
            <>
              <dt className="text-zinc-500">Situação</dt>
              <dd>{STATUS_DA_SERIE[midia.status] ?? midia.status}</dd>
            </>
          )}
        </>
      )}
    </dl>
  );
}
