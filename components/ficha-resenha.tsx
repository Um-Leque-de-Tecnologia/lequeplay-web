import { FichaResenhaCampo } from "@/components/ficha-resenha-campo";

export function FichaResenha({ titulo }: { titulo: string }) {
  return (
    <section aria-labelledby="resenha" className="mt-12">
      <h2 id="resenha" className="mb-3 text-xl font-semibold">
        Sua resenha
      </h2>

      <label htmlFor="texto" className="block text-sm text-zinc-400">
        O que você achou de {titulo}?
      </label>

      <FichaResenhaCampo />

      {/*
        Desabilitado enquanto `PUT /midias/{id}/resenha` não existe na API —
        o contrato marca a camada social como backlog. O campo já fica de pé
        para a tela nascer pronta no dia em que o endpoint subir.
      */}
      <button
        type="button"
        disabled
        className="mt-3 rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
      >
        Publicar resenha
      </button>
    </section>
  );
}

