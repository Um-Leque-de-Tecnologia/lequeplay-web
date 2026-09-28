import Link from "next/link";
import { FichaResenhaCampo } from "@/components/ficha-resenha-campo";
import { FichaResenhaFormulario } from "@/components/ficha-resenha-formulario";
import { buscarUsuarioLogado } from "@/lib/dal";
import { RESENHA_PUBLICAVEL } from "@/lib/recursos";

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
 * A Server Action de publicar **existe** desde então, em
 * `app/midias/[slug]/acoes.ts`, escrita inteira com a invalidação certa — é
 * ela que impede o bug clássico de a ficha continuar mostrando o estado
 * anterior depois de publicar. O que ela não faz é rodar: enquanto
 * `RESENHA_PUBLICAVEL` (em `lib/recursos.ts`) estiver desligado, o botão
 * continua desligado com a frase honesta, porque um clique que falha é pior
 * do que um botão que assume não existir ainda.
 *
 * Ligar é uma linha no `.env` no dia em que o endpoint subir — não é
 * reescrever esta tela.
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

      {/*
        A action de publicar existe e está pronta (`app/midias/[slug]/acoes.ts`),
        com a invalidação que faz a ficha mostrar a resenha sem ninguém apertar
        F5. O que ainda não existe é o endereço para onde mandar.

        Enquanto `RESENHA_PUBLICAVEL` estiver desligado, a tela continua
        dizendo a verdade: campo aberto, botão desligado, motivo escrito. O
        contrário — ligar o botão porque o código do nosso lado está pronto —
        entregaria um clique que falha, que é pior do que um botão honesto.
      */}
      {RESENHA_PUBLICAVEL ? (
        <FichaResenhaFormulario slug={slug} titulo={titulo} />
      ) : (
        <>
          <label htmlFor="texto" className="block text-sm text-zinc-400">
            O que você achou de {titulo}?
          </label>

          <FichaResenhaCampo />

          <button
            type="button"
            disabled
            className="mt-3 rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
          >
            Publicar resenha
          </button>

          <p className="mt-2 text-sm text-zinc-500">
            Você está logado, mas publicar resenha ainda não existe na API — o
            que você escrever aqui não será salvo. Estamos esperando o
            endpoint.
          </p>
        </>
      )}
    </section>
  );
}
