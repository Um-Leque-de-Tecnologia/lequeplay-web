import type { Metadata } from "next";
import { CatalogoBusca } from "@/components/catalogo-busca";
import { CatalogoChipsGenero } from "@/components/catalogo-chips-genero";
import {
  CatalogoGrade,
  type OrdemDaApi,
  type PosicaoNaListagem,
} from "@/components/catalogo-grade";
import {
  CatalogoPaginacao,
  CatalogoPaginaInexistente,
} from "@/components/catalogo-paginacao";
import { CatalogoVazio } from "@/components/catalogo-vazio";
import {
  buscarNoCatalogo,
  listarGeneros,
  listarMidias,
  type FiltrosCatalogo,
} from "@/lib/api";
import { lerFiltrosDoCatalogo } from "@/lib/filtros-do-catalogo";
import type { Midia } from "@/lib/tipos";

export const metadata: Metadata = { title: "Catálogo" };

/**
 * Quantos títulos a busca traz para a grade.
 *
 * Não o teto de 100: pelo significado, sempre existe um título "mais perto",
 * e a busca devolve até o limite mesmo quando só os primeiros têm a ver. Com
 * os 60 títulos do acervo, 100 seria o catálogo inteiro reordenado, com o fim
 * da lista cheio de título que não tem nada a ver com o pedido.
 *
 * Nem pouco demais: a busca não tem página seguinte, e o que fica fora do
 * limite não aparece nunca. Uma busca por nome que acha muita coisa de
 * verdade — os filmes de uma franquia — precisa de folga.
 *
 * E 24, e não os 20 que a API usa quando ninguém diz nada, porque 24 fecha as
 * linhas da grade nas três larguras (2, 3 e 4 colunas).
 */
const LIMITE_DA_BUSCA = 24;

/** O que a grade precisa, venha da busca ou da listagem. */
type ConteudoDaGrade = {
  itens: Midia[];
  resultadoCompleto: boolean;
  ordemDaApi: OrdemDaApi;
  /** Só na listagem: a busca é um ranking, e ranking não tem página. */
  posicao?: PosicaoNaListagem;
};

/**
 * Com consulta, a grade vem da busca (`GET /v1/busca`), que acha pelas
 * palavras e pelo significado; sem consulta, da listagem (`GET /v1/midias`).
 *
 * As duas respostas não têm o mesmo formato, e a diferença não é detalhe: a
 * listagem é uma **página**, com `pagina` e `total`; a busca é uma **lista
 * ranqueada**, sem total e sem página seguinte. Por isso a busca não ganha
 * paginação — não existe a página 2 de um ranking.
 *
 * Os filtros valem nos dois caminhos (LP-601): o `openapi.yaml` da API
 * declara `tipo` e `genero` também em `/v1/busca`, e lá eles filtram antes de
 * ranquear. Com uma consulta na URL, o chip de gênero recorta a busca, em vez
 * de trocar a busca pela listagem ou de ser ignorado em silêncio.
 */
async function lerCatalogo(filtros: FiltrosCatalogo): Promise<ConteudoDaGrade> {
  // `?q=` vazio fica na listagem: a API responde 400 ("Consulta ausente") a
  // uma busca sem consulta.
  if (filtros.q) {
    const { itens } = await buscarNoCatalogo(
      filtros.q,
      LIMITE_DA_BUSCA,
      filtros.tipo,
      // Sem `modo`: o padrão da API (`auto`) é o que o catálogo quer.
      undefined,
      filtros.genero,
    );

    return {
      itens,
      // Os primeiros de um ranking não são o resultado inteiro: "A-Z" em
      // cima deles poria em ordem alfabética os mais relevantes, que é o
      // mesmo erro de ordenar uma página (docs/ordenacao-catalogo.md).
      resultadoCompleto: false,
      ordemDaApi: "relevancia",
    };
  }

  // A página que vale é a que a API **diz** ter devolvido, e não a que foi
  // pedida. Parâmetro de paginação com nome errado não dá erro: a API o
  // ignora e manda a primeira página. Lendo `pagina` da resposta, um pedido
  // ignorado aparece na tela como "página 1", que é o que a grade mostra — e
  // não como a página 3 com os itens da 1.
  const { itens, pagina, porPagina, total } = await listarMidias(filtros);

  return {
    itens,
    // `total` é o tamanho do resultado inteiro, não da página: é a
    // única forma de a grade saber se tem tudo para poder ordenar.
    resultadoCompleto: pagina === 1 && itens.length >= total,
    ordemDaApi: "popularidade",
    posicao: {
      total,
      pagina,
      // Sem resultado ainda é "página 1 de 1", e não "de 0".
      totalDePaginas: Math.max(1, Math.ceil(total / porPagina)),
    },
  };
}

// `searchParams` é uma Promise no Next 16 — precisa de await.
export default async function Catalogo({ searchParams }: PageProps<"/midias">) {
  // Daqui para baixo, só valor conferido (LP-606). Valor que a API não
  // aceita (`?tipo=Filme`) ou parâmetro repetido com valores diferentes
  // (`?q=a&q=b`) chega como ausente: a página responde como se ele não
  // estivesse na URL. A regra e o porquê estão em `lib/filtros-do-catalogo.ts`.
  const { tipo, genero, q, pagina } = lerFiltrosDoCatalogo(
    await searchParams,
  );

  // `Promise.all` porque uma busca não depende da outra: em série, a página
  // esperaria a soma dos dois tempos em vez do maior deles.
  const [{ itens, resultadoCompleto, ordemDaApi, posicao }, generos] =
    await Promise.all([
      lerCatalogo({ tipo, genero, q, pagina }),
      listarGeneros(),
    ]);

  // Uma página depois da última (`?pagina=9` num catálogo de 3): a API
  // responde 200, com `itens: []` e o `total` inteiro. Não é "nenhum título
  // encontrado" — os títulos existem, só não nesta página —, e a tela diz
  // isso, com o caminho para a última que existe. Com `total` 0, a página
  // não importa: nada casou com o filtro, e o vazio de sempre é a resposta.
  const alemDaUltima =
    posicao !== undefined &&
    posicao.total > 0 &&
    posicao.pagina > posicao.totalDePaginas;

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        Catálogo
      </h1>

      <CatalogoBusca consulta={q ?? ""} />

      <CatalogoChipsGenero generos={generos} generoAtual={genero} />

      <CatalogoGrade
        itens={itens}
        resultadoCompleto={resultadoCompleto}
        ordemDaApi={ordemDaApi}
        posicao={posicao}
        vazio={
          alemDaUltima ? (
            <CatalogoPaginaInexistente
              pagina={posicao.pagina}
              total={posicao.total}
              totalDePaginas={posicao.totalDePaginas}
            />
          ) : (
            <CatalogoVazio q={q} tipo={tipo} genero={genero} />
          )
        }
      />

      {/* Sem links quando tudo cabe numa página: "página 1 de 1", na linha
          da contagem, já diz que não há próxima. */}
      {posicao && !alemDaUltima && posicao.totalDePaginas > 1 && (
        <CatalogoPaginacao
          pagina={posicao.pagina}
          totalDePaginas={posicao.totalDePaginas}
        />
      )}
    </>
  );
}
