"use server";

/**
 * Laboratório da aula 05 (descartável). Conceito: A FUNÇÃO É UM ENDEREÇO.
 *
 * Com "use server" no topo, `avaliar` vira um POST que o navegador dispara.
 * O corpo desta função nunca é baixado pelo navegador.
 */

export type EstadoNota = { erro?: string; nota?: number };

export async function avaliar(
  _anterior: EstadoNota,
  dados: FormData,
): Promise<EstadoNota> {
  const nota = Number(dados.get("nota"));

  // Validar aqui não é capricho: quem manda o POST pode não ser a nossa tela.
  if (!Number.isInteger(nota) || nota < 1 || nota > 5) {
    return { erro: "A nota precisa ser um número de 1 a 5." };
  }

  // Devolve só o que a tela mostra: o retorno viaja inteiro para o navegador.
  return { nota };
}