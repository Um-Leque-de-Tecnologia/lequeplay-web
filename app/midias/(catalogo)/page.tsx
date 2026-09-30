import type { Metadata } from "next";
import { CatalogoBusca } from "@/components/catalogo-busca";
import { CatalogoChipsGenero } from "@/components/catalogo-chips-genero";
import { CatalogoGrade, type OrdemDaApi } from "@/components/catalogo-grade";
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

  const { itens, pagina, total } = await listarMidias(filtros);

  return {
    itens,
    // `total` é o tamanho do resultado inteiro, não da página: é a
    // única forma de a grade saber se tem tudo para poder ordenar.
    resultadoCompleto: pagina === 1 && itens.length >= total,
    ordemDaApi: "popularidade",
  };
}

// `searchParams` é uma Promise no Next 16 — precisa de await.
export default async function Catalogo({ searchParams }: PageProps<"/midias">) {
  // Daqui para baixo, só valor conferido (LP-606). Valor que a API não
  // aceita (`?tipo=Filme`) ou parâmetro repetido com valores diferentes
  // (`?q=a&q=b`) chega como ausente: a página responde como se ele não
  // estivesse na URL. A regra e o porquê estão em `lib/filtros-do-catalogo.ts`.
  const { tipo, genero, q } = lerFiltrosDoCatalogo(await searchParams);

  // `Promise.all` porque uma busca não depende da outra: em série, a página
  // esperaria a soma dos dois tempos em vez do maior deles.
  const [{ itens, resultadoCompleto, ordemDaApi }, generos] = await Promise.all([
    lerCatalogo({ tipo, genero, q }),
    listarGeneros(),
  ]);

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        Catálogo
      </h1>

      <CatalogoBusca consulta={q ?? ""} />

      <CatalogoChipsGenero generos={generos} />

      <CatalogoGrade
        itens={itens}
        resultadoCompleto={resultadoCompleto}
        ordemDaApi={ordemDaApi}
        vazio={<CatalogoVazio q={q} tipo={tipo} genero={genero} />}
      />
    </>
  );
}
