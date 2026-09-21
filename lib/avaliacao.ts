import type { Midia } from "@/lib/tipos";

/**
 * O que basta para falar de nota. `Pick` e não `Midia` inteira porque estas
 * regras não precisam do resto do título — e assim elas servem a qualquer
 * coisa que tenha nota, não só ao catálogo.
 */
type Avaliada = Pick<Midia, "notaMedia" | "totalAvaliacoes">;

/**
 * Quem responde "ninguém avaliou" é o CONTADOR, não a nota: a API manda
 * `notaMedia` sempre como número, então o `0` de um título sem voto nenhum é
 * o mesmo `0` de um título detestado. Só `totalAvaliacoes` separa os dois.
 */
export function temAvaliacoes(midia: Avaliada): boolean {
  return midia.totalAvaliacoes > 0;
}

/**
 * A nota como a tela mostra: uma casa decimal e vírgula, que é como se
 * escreve número em português. `toLocaleString` e não `toFixed`, porque o
 * `toFixed` devolve sempre o ponto americano — `8.4` em vez de `8,4`.
 *
 * Os dois limites juntos importam: sem o mínimo, uma nota redonda viraria
 * `8` em vez de `8,0`; sem o máximo, uma média dízima viraria `8,4000001`.
 *
 * Mora numa função só porque o cartão da grade e a ficha mostram a mesma
 * nota — e dois lugares formatando o mesmo número viram, com o tempo, dois
 * formatos diferentes. Foi exatamente o que aconteceu antes do LP-213.
 */
export function notaFormatada(midia: Avaliada): string {
  return midia.notaMedia.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}
