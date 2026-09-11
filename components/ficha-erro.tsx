"use client";

import { useRouter } from "next/navigation";

type TipoDeErro = "api" | "tempo-esgotado" | "credencial";

const MENSAGENS: Record<
  TipoDeErro,
  { titulo: string; descricao: string }
> = {
  api: {
    titulo: "Não foi possível carregar esta ficha",
    descricao: "A API encontrou um problema. Tente novamente em alguns instantes.",
  },
  "tempo-esgotado": {
    titulo: "A API demorou demais",
    descricao: "Isso pode ser passageiro. Tente carregar a ficha novamente.",
  },
  credencial: {
    titulo: "Não foi possível acessar a ficha",
    descricao: "O serviço está com um problema de credencial. Tente novamente mais tarde.",
  },
};

export function FichaErro({ tipo }: { tipo: TipoDeErro }) {
  const router = useRouter();
  const mensagem = MENSAGENS[tipo];

  return (
    <section aria-labelledby="titulo-erro-ficha" className="py-16 text-center">
      <h1 id="titulo-erro-ficha" className="text-2xl font-semibold">
        {mensagem.titulo}
      </h1>
      <p className="mx-auto mt-3 max-w-lg text-zinc-400">
        {mensagem.descricao}
      </p>
      <button
        type="button"
        onClick={() => router.refresh()}
        className="mt-6 rounded-md bg-violet-600 px-4 py-2 font-medium text-white transition hover:bg-violet-500"
      >
        Tentar de novo
      </button>
    </section>
  );
}