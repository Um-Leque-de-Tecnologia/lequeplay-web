/**
 * Quem fez o quê — lido de `creditos`, que é o único lugar onde a API guarda
 * pessoas.
 *
 * A ficha mostra "Direção", "Apresentação" e "Elenco" como se fossem três
 * campos, mas na resposta eles são uma lista só, separada por `papel`. Estas
 * funções fazem essa separação num lugar só, porque duas telas já precisam
 * dela — a ficha técnica e a aba de elenco — e duas cópias do mesmo
 * `filter(...)` viram uma cópia só que ninguém atualizou.
 *
 * Todas aceitam `creditos` ausente: `creditos` **só vem no detalhe**, nunca
 * na listagem, então `undefined` aqui é o caso normal, não erro. A resposta
 * para "não veio" é a lista vazia — quem chama decide se esconde a linha.
 */

import type { Credito, Papel } from "@/lib/tipos";

function doPapel(creditos: Credito[] | undefined, papel: Papel): Credito[] {
  // A API já manda ordenado por relevância; `filter` preserva a ordem, então
  // `[0]` continua sendo o crédito principal depois de filtrar.
  return creditos?.filter((c) => c.papel === papel) ?? [];
}

/**
 * Os nomes de quem dirigiu. **Lista**, e não um nome só: filme com dois
 * diretores existe, e foi justamente o que derrubou o antigo
 * `Filme.diretor: string`.
 */
export function direcaoDe(creditos: Credito[] | undefined): string[] {
  return doPapel(creditos, "direcao").map((c) => c.pessoa.nome);
}

/** Os nomes de quem apresenta. Lista pelo mesmo motivo: podcast tem dupla. */
export function apresentacaoDe(creditos: Credito[] | undefined): string[] {
  return doPapel(creditos, "apresentacao").map((c) => c.pessoa.nome);
}

/**
 * O elenco inteiro, em ordem de relevância. Devolve o `Credito` e não só o
 * nome porque quem mostra elenco quase sempre quer o `personagem` junto.
 */
export function elencoDe(creditos: Credito[] | undefined): Credito[] {
  return doPapel(creditos, "elenco");
}
