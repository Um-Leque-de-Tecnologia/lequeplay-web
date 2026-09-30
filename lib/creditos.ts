import type { Filme, Podcast } from "@/lib/tipos";

/**
 * Deriva quem dirige um filme a partir de `creditos` (papel `"direcao"`).
 *
 * Todos os nomes: a API grava um crédito por pessoa, e um filme dirigido a
 * quatro mãos chega com dois. `undefined` quando não há nenhum, para quem
 * mostra esconder o rótulo junto, em vez de escrever "Direção" sem nome
 * (LP-205). O `diretor` solto só existe no mock; a API não manda.
 */
export function obterDiretor(midia: Filme): string | undefined {
  const nomes = (midia.creditos ?? [])
    .filter((c) => c.papel === "direcao")
    .map((c) => c.pessoa.nome);

  return nomes.length > 0 ? nomes.join(", ") : midia.diretor;
}

/**
 * Deriva o nome de quem apresenta a partir de `creditos`.
 * No LequePlay, a apresentação não é um campo escalar: vem do crédito
 * onde `papel === "apresentacao"`.
 *
 * NOTA: O fallback para `midia.apresentador` é estritamente provisório,
 * mantido apenas para compatibilidade enquanto os dados legados do mock
 * não forem completamente migrados para `creditos`.
 */
export function obterApresentador(midia: Podcast): string {
  const credito = midia.creditos?.find((c) => c.papel === "apresentacao");
  return credito?.pessoa.nome ?? midia.apresentador ?? "";
}
