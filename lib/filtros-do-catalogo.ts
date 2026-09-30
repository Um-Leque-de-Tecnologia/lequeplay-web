/**
 * A leitura da URL do catálogo, num lugar só (LP-606).
 *
 * A URL é digitável: link antigo, valor escrito à mão, parâmetro colado duas
 * vezes. O que chega em `searchParams` é texto sem garantia nenhuma, e o
 * `tipo as Midia["tipo"]` que morava na página só convencia o compilador — um
 * `?tipo=Filme` ia direto para a API e esvaziava o catálogo.
 *
 * **A regra, a mesma para todo parâmetro:** ele vale quando a URL dá a ele um
 * valor só, e esse valor é um que o contrato da API aceita (`tipo` é um de
 * três, `pagina` é inteiro a partir de 1, `genero` e `q` são texto). Senão, é
 * **ignorado**: a página responde como se ele não estivesse na URL.
 *
 * - `?tipo=xyz`, `?tipo=Filme`, `?pagina=-3`, `?pagina=1.5`: ignorados.
 * - Vazio (`?tipo=`, `?q=`): ignorado — é o que um formulário GET manda
 *   quando o campo fica em branco.
 * - Repetido com valores diferentes (`?genero=Comédia&genero=Drama`):
 *   ignorado. Com o mesmo valor, vale uma vez.
 *
 * Ignorar, e não corrigir nem avisar:
 *
 * - **Corrigir é adivinhar**, e cada filtro pediria um palpite diferente:
 *   `-3` é a página 1 ou a 3? Dos dois gêneros, qual? E aceitar `Filme` pede
 *   aceitar `FILME`, `Filmes`, `filmes`… — cada grafia a mais é mais um
 *   endereço para a mesma página, e a API não aceita nenhuma delas.
 * - **A URL é lida em mais de um lugar** (aqui, e a ordem na grade). Um valor
 *   que um leitor corrige e o outro lê cru faz a tela discordar dela mesma.
 *   Ignorar é o que todo leitor já faz com o que não conhece (`lerOrdem`).
 * - **Avisar** seria explicar um endereço que o site não gera: quem chega a
 *   `?tipo=xyz` escreveu à mão. E ignorar nunca esvazia a tela: no pior
 *   caso, ela mostra mais do que o pedido — o que se vê na hora, ao
 *   contrário de um catálogo vazio, que parece "não temos nada".
 */

import type { Midia } from "@/lib/tipos";

/**
 * Um parâmetro como o Next entrega em `searchParams`: texto quando aparece
 * uma vez, lista quando se repete, nada quando falta.
 */
type ValorDaUrl = string | readonly string[] | undefined;

export type ParametrosDaUrl = Record<string, string | string[] | undefined>;

/** O que a página pode usar sem conferir de novo. */
export type FiltrosConferidos = {
  tipo?: Midia["tipo"];
  /**
   * Texto, conferido só na forma. Quais gêneros existem é dado da API
   * (`GET /v1/generos`), e não um conjunto fechado no front: o contrato
   * declara `string`. Um gênero sem título devolve zero, e a tela já tem o
   * estado vazio, com a saída para o catálogo inteiro.
   */
  genero?: string;
  q?: string;
  /**
   * Sempre presente: sem um `?pagina=` que valha, é a primeira, como na API
   * (`default: 1`). Uma página além da última é outro assunto (LP-604).
   */
  pagina: number;
};

/**
 * O valor de um parâmetro, se a URL der a ele um valor só.
 *
 * Repetir o mesmo valor ainda é um valor só; valores diferentes são uma
 * pergunta com duas respostas, e nenhuma vale. Vazio é ausente.
 */
export function valorUnico(valor: ValorDaUrl): string | undefined {
  const valores = typeof valor === "string" ? [valor] : (valor ?? []);
  const primeiro = valores[0];

  if (!primeiro || valores.some((outro) => outro !== primeiro)) {
    return undefined;
  }

  return primeiro;
}

/**
 * Os tipos como o contrato escreve (`enum: [filme, serie, podcast]`).
 *
 * Um objeto, e não uma lista: se `Midia` ganhar um quarto tipo, o compilador
 * cobra a chave aqui, em vez de o filtro recusar o tipo novo em silêncio.
 */
const TIPOS: { [T in Midia["tipo"]]: T } = {
  filme: "filme",
  serie: "serie",
  podcast: "podcast",
};

function lerTipo(valor: string | undefined): Midia["tipo"] | undefined {
  return Object.values(TIPOS).find((tipo) => tipo === valor);
}

/**
 * Só algarismos: `-3`, `1.5`, `2e1` e `abc` não são página, e um número
 * grande demais para ser exato também não.
 */
function lerPagina(valor: string | undefined): number | undefined {
  if (!valor || !/^\d+$/.test(valor)) {
    return undefined;
  }

  const pagina = Number(valor);
  return Number.isSafeInteger(pagina) && pagina >= 1 ? pagina : undefined;
}

/**
 * Os filtros do catálogo, já conferidos. É a única porta entre o
 * `searchParams` da página e as chamadas à API.
 */
export function lerFiltrosDoCatalogo(
  parametros: ParametrosDaUrl,
): FiltrosConferidos {
  return {
    tipo: lerTipo(valorUnico(parametros.tipo)),
    genero: valorUnico(parametros.genero),
    q: valorUnico(parametros.q),
    pagina: lerPagina(valorUnico(parametros.pagina)) ?? 1,
  };
}
