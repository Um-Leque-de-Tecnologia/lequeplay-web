import { timingSafeEqual } from "node:crypto";

/**
 * A tranca das rotas que soltam cache (`/api/revalidar`).
 */
export function pedidoAutorizado(pedido: Request): boolean {
  const segredo = process.env.REVALIDAR_SEGREDO;

  // Sem segredo configurado, a porta fica FECHADA.
  if (!segredo) return false;

  const recebido = Buffer.from(pedido.headers.get("x-revalidar-segredo") ?? "");
  const esperado = Buffer.from(segredo);

  // `timingSafeEqual` evita ataques de tempo (timing attacks)
  return recebido.length === esperado.length && timingSafeEqual(recebido, esperado);
}