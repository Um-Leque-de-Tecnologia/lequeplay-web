import Link from "next/link";
import { FichaResenhaCampo } from "@/components/ficha-resenha-campo";
import { buscarUsuarioLogado } from "@/lib/dal";

/**
 * O bloco da resenha, que agora sabe se há alguém logado — e continua sem
 * prometer o que a API não faz.
 *
 * ## O endpoint não existe, e isso é medido
 *
 * Na API publicada, hoje:
 *
 * ```
 * GET /v1/midias/{id}          -> 200
 * GET /v1/midias/{id}/resenha  -> 404 page not found
 * ```
 *
 * O roteador da API (`internal/catalog/handler.go`) declara `/v1/midias`,
 * `/v1/midias/{id}`, `/v1/busca`, `/v1/generos` e `/v1/catalogo/versao`. Nada
 * de resenha — e o `openapi.yaml` também não a menciona. O contrato do time
 * marca a camada social como 🕓 **combinado**, não realidade.
 *
 * Por isso **não** existe Server Action de publicar aqui. Escrever uma que
 * chama um endereço inexistente entregaria um botão que falha no clique — e
 * um botão que falha é pior do que um botão desligado com uma frase honesta.
 *
 * ## O que a conta muda, então
 *
 * Só quem vê o quê:
 *
 * - **sem sessão:** um convite para entrar, com o caminho de volta para esta
 *   ficha;
 * - **com sessão:** o campo de escrever, e a verdade de que publicar ainda
 *   não existe.
 */
export async function FichaResenha({
  titulo,
  slug,
}: {
  titulo: string;
  slug: string;
}) {
  const usuario = await buscarUsuarioLogado();

  if (!usuario) {
    return (
      <section aria-labelledby="resenha" className="mt-12">
        <h2 id="resenha" className="mb-3 text-xl font-semibold">
          Sua resenha
        </h2>

        <p className="text-sm text-zinc-400">
          Entre para escrever uma resenha sobre {titulo}.
        </p>

        {/*
          O `de` traz a pessoa de volta para esta ficha depois do login. Quem
          confere esse destino é o filtro do LP-407: aqui ele é escrito por
          nós, mas lá chega como texto de estranho.
        */}
        <Link
          href={`/entrar?de=${encodeURIComponent(`/midias/${slug}`)}`}
          className="mt-3 inline-block rounded-full bg-violet-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-violet-500"
        >
          Entrar
        </Link>
      </section>
    );
  }

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
        Continua desabilitado, agora com o motivo escrito na tela. A conta
        existe, a vontade existe, o endereço para onde mandar é que não —
        conferido: a rota responde 404 na API publicada.
      */}
      <button
        type="button"
        disabled
        className="mt-3 rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
      >
        Publicar resenha
      </button>

      <p className="mt-2 text-sm text-zinc-500">
        Você está logado, mas publicar resenha ainda não existe na API — o que
        você escrever aqui não será salvo. Estamos esperando o endpoint.
      </p>
    </section>
  );
}
