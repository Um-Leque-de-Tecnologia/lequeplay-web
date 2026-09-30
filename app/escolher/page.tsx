import type { Metadata } from "next";
import { connection } from "next/server";
import { EscolherFormulario } from "@/components/escolher-formulario";
import {
  MAXIMO_DO_PEDIDO,
  type MotivoDesligada,
  motivoDaRecomendacaoDesligada,
} from "@/lib/recomendacao";

export const metadata: Metadata = {
  title: "Me ajuda a escolher",
  description:
    "Descreva o que você quer ver e receba até três títulos do catálogo, com o motivo de cada um.",
};

const POR_QUE_DESLIGADA: Record<MotivoDesligada, string> = {
  mock:
    "O site está usando os dados de exemplo (USAR_MOCK), e a busca de exemplo só acha palavras exatas — não daria para recomendar a partir de um pedido como este.",
  "sem-chave":
    "Falta configurar a chave do modelo de IA (GEMINI_API_KEY) no servidor.",
};

export default async function Escolher() {
  // A decisão sai das variáveis de ambiente **na hora do pedido**, e não no
  // build: sem isto a página seria estática, e uma chave configurada depois
  // do deploy nunca apareceria aqui.
  await connection();
  const motivo = motivoDaRecomendacaoDesligada();

  return (
    <article>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        Me ajuda a escolher
      </h1>

      <p className="mt-4 max-w-prose text-zinc-300">
        Escreva o que você quer ver do seu jeito — o clima, com quem, quanto
        tempo tem. A gente procura no catálogo e sugere até três títulos,
        dizendo por quê.
      </p>

      {motivo ? (
        <div
          role="status"
          className="mt-6 max-w-prose rounded-md border border-white/10 bg-zinc-900 p-4"
        >
          <p className="font-medium text-zinc-200">Recomendação desligada</p>
          <p className="mt-1 text-sm text-zinc-400">{POR_QUE_DESLIGADA[motivo]}</p>
          <p className="mt-1 text-sm text-zinc-400">
            Enquanto isso, o catálogo e a busca continuam funcionando.
          </p>
        </div>
      ) : (
        <EscolherFormulario maximo={MAXIMO_DO_PEDIDO} />
      )}
    </article>
  );
}
