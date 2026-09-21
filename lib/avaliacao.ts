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
 * A nota como a tela mostra, numa função só: o cartão e a ficha mostravam a
 * mesma nota com formatações diferentes, e dois lugares formatando o mesmo
 * número viram, com o tempo, dois formatos diferentes.
 */
export function notaFormatada(midia: Avaliada): string {
  return midia.notaMedia.toFixed(1);
}
