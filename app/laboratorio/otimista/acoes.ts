"use server";

import { revalidatePath } from "next/cache";

export async function salvarNota(slug: string, nota: number) {
  const resposta = await fetch(`${process.env.API_URL}/midias/${slug}/avaliacao`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ nota }),
    cache: "no-store",
  });

  // Lançar aqui é o que faz a estrela voltar sozinha no passo 10.
  if (!resposta.ok) throw new Error(`a API respondeu ${resposta.status}`);

  revalidatePath("/laboratorio/otimista");
}