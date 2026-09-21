import { revalidateTag } from "next/cache";
import { pedidoAutorizado } from "@/lib/revalidacao";

/**
 * Solta o cache de uma etiqueta, sob demanda (LP-309).
 */
export async function POST(pedido: Request) {
  // 1. A tranca, ANTES de qualquer trabalho
  if (!pedidoAutorizado(pedido)) {
    return new Response(null, { status: 401 });
  }

  // 2. Qual etiqueta vem no corpo
  const corpo: unknown = await pedido.json().catch(() => null);
  const etiqueta =
    typeof corpo === "object" &&
    corpo !== null &&
    "etiqueta" in corpo &&
    typeof corpo.etiqueta === "string"
      ? corpo.etiqueta.trim()
      : "";

  if (etiqueta === "") {
    return Response.json(
      { erro: 'Mande a etiqueta no corpo: { "etiqueta": "midia:reacher" }' },
      { status: 400 },
    );
  }

  // 3. O trabalho com expire: 0 para expirar imediatamente
  revalidateTag(etiqueta, { expire: 0 });

  // 4. Resposta de sucesso
  return Response.json({ revalidado: etiqueta, em: new Date().toISOString() });
}