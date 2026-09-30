"use server";

import {
  ErroDaRecomendacao,
  pedirRecomendacao,
  prepararRecomendacao,
} from "@/lib/recomendacao";
import { type TrechoDaResposta, interpretarResposta } from "@/lib/recomendacao-comum";

export type EstadoDaRecomendacao =
  | { tipo: "inicial" }
  | { tipo: "erro"; mensagem: string; pedido: string }
  | { tipo: "resposta"; pedido: string; trechos: TrechoDaResposta[] };

/**
 * Recomenda de 1 a 3 títulos para um pedido em texto livre, de uma vez.
 *
 * Com JavaScript, o formulário não chega aqui: ele lê a resposta em pedaços
 * do `/api/recomendar` (LP-704). Esta action é o caminho de quem está sem
 * JavaScript — o `<form>` posta e a página volta com a resposta inteira.
 *
 * Server Action, e não página que chama o modelo ao renderizar: chamar o
 * Gemini custa cota. Numa página com `?pedido=`, prefetch de link, robô de
 * busca e link compartilhado gastariam cota a cada visita. POST só acontece
 * quando alguém envia o formulário.
 *
 * É endereço público (docs/server-actions-seguranca.md); as conferências
 * estão em `prepararRecomendacao`, as mesmas da rota.
 */
export async function recomendar(
  _estadoAnterior: EstadoDaRecomendacao,
  formData: FormData,
): Promise<EstadoDaRecomendacao> {
  const preparo = await prepararRecomendacao(formData.get("pedido"));
  if (!preparo.ok) {
    return { tipo: "erro", mensagem: preparo.mensagem, pedido: preparo.pedido };
  }

  const { pedido, candidatos } = preparo;

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
