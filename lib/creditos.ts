import type { Podcast } from "@/lib/tipos";

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
