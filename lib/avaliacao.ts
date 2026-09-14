import type { Midia } from "@/lib/tipos";

type Avaliada = Pick<Midia, "notaMedia" | "totalAvaliacoes">;

export function temAvaliacoes(midia: Avaliada): boolean {
  return midia.totalAvaliacoes > 0;
}

export function notaFormatada(midia: Avaliada): string {
  return midia.notaMedia.toFixed(1);
}