"use server";

import { buscarNoCatalogo } from "@/lib/api";
import {
  ErroDaRecomendacao,
  MAXIMO_DO_PEDIDO,
  type TrechoDaResposta,
  escolherCandidatos,
  interpretarResposta,
  motivoDaRecomendacaoDesligada,
  pedirRecomendacao,
} from "@/lib/recomendacao";

export type EstadoDaRecomendacao =
  | { tipo: "inicial" }
  | { tipo: "erro"; mensagem: string; pedido: string }
  | { tipo: "resposta"; pedido: string; trechos: TrechoDaResposta[] };

/**
 * Recomenda de 1 a 3 títulos para um pedido em texto livre.
 *
 * Server Action, e não página que chama o modelo ao renderizar: chamar o
 * Gemini custa cota. Numa página com `?pedido=`, prefetch de link, robô de
 * busca e link compartilhado gastariam cota a cada visita. POST só acontece
 * quando alguém envia o formulário.
 *
 * É endereço público (docs/server-actions-seguranca.md). Por isso:
 * - o "desligado" é conferido aqui, e não só pela página não mostrar o
 *   botão: quem postar direto também é recusado;
 * - o pedido tem teto de tamanho, porque é texto de estranho que vira prompt
 *   pago.
 */
export async function recomendar(
  _estadoAnterior: EstadoDaRecomendacao,
  formData: FormData,
): Promise<EstadoDaRecomendacao> {
  const bruto = formData.get("pedido");
  const pedido = typeof bruto === "string" ? bruto.trim() : "";

  if (motivoDaRecomendacaoDesligada()) {
    return { tipo: "erro", mensagem: "A recomendação está desligada.", pedido };
  }

  if (!pedido) {
    return { tipo: "erro", mensagem: "Escreva o que você quer ver.", pedido };
  }

  if (pedido.length > MAXIMO_DO_PEDIDO) {
    return {
      tipo: "erro",
      mensagem: `O pedido passou de ${MAXIMO_DO_PEDIDO} caracteres. Encurte um pouco.`,
      pedido,
    };
  }

  let candidatos;
  try {
    candidatos = escolherCandidatos((await buscarNoCatalogo(pedido)).itens);
  } catch (erro) {
    console.error("[recomendar] busca falhou:", erro);
    return {
      tipo: "erro",
      mensagem: "Não conseguimos consultar o catálogo agora. Tente de novo.",
      pedido,
    };
  }

  // Sem candidato, o modelo não tem de onde escolher — e a chamada paga não
  // acontece.
  if (candidatos.length === 0) {
    return {
      tipo: "erro",
      mensagem:
        "Nada no catálogo parece com esse pedido. Tente descrever de outro jeito.",
      pedido,
    };
  }

  try {
    const texto = await pedirRecomendacao(pedido, candidatos);
    return { tipo: "resposta", pedido, trechos: interpretarResposta(texto, candidatos) };
  } catch (erro) {
    if (!(erro instanceof ErroDaRecomendacao)) throw erro;

    // O motivo real (status, timeout) fica no log do servidor; a tela recebe
    // uma frase só.
    console.error("[recomendar]", erro.message);
    return {
      tipo: "erro",
      mensagem: "A recomendação não respondeu agora. Tente de novo em instantes.",
      pedido,
    };
  }
}
