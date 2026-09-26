import type { Filme, Podcast } from "@/lib/tipos";

/** Deriva o nome da pessoa que dirige um filme a partir dos créditos. */
export function obterDiretor(midia: Filme): string {
  const credito = midia.creditos?.find((c) => c.papel === "direcao");
  return credito?.pessoa.nome ?? midia.diretor ?? "";
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
