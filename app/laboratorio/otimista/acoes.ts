"use server";

import { revalidatePath } from "next/cache";

type ResultadoSalvamento =
  | { ok: true }
  | { ok: false; mensagem: string };

export async function salvarNota(
  slug: string,
  nota: number,
): Promise<ResultadoSalvamento> {
  const resposta = await fetch(`${process.env.API_URL}/midias/${slug}/avaliacao`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ nota }),
    cache: "no-store",
  });

  if (!resposta.ok) {
    return {
      ok: false,
      mensagem:
        resposta.status === 409
          ? "A avaliação mudou. Atualize a página e tente novamente."
          : "Não foi possível salvar sua avaliação. Tente novamente.",
    };
  }

  revalidatePath("/laboratorio/otimista");
  return { ok: true };
}