import type { Metadata, ResolvingMetadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CabecalhoDaMidia } from "@/components/cabecalho-da-midia";
import { FichaAbas } from "@/components/ficha-abas";
import { FichaCompartilhar } from "@/components/ficha-compartilhar";
import { FichaPodcast } from "@/components/ficha-podcast";
import { FichaResenha } from "@/components/ficha-resenha";
import { FichaTemporadas } from "@/components/ficha-temporadas";
import { buscarMidia } from "@/lib/api";
import { corte } from "@/lib/utils";

type SearchParams = {
  temporada?: string;
  episodio?: string;
  episodios?: string;
};

export async function generateMetadata(
  { params }: PageProps<"/midias/[slug]">,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { slug } = await params;

  const midia = await buscarMidia(slug);

  if (!midia) {
    return {
      title: "Mídia não encontrada",
      description: "A mídia solicitada não existe no catálogo.",
    };
  }

  // O mesmo corte da sinopse que a ficha usa na tela: o resumo lido na página
  // e o que aparece na prévia do link são o mesmo texto, então cortam no mesmo
  // lugar — no espaço, nunca no meio da palavra. As reticências são o caractere
  // `…`, e não três pontos seguidos.
  //
  // Sem sinopse — a API manda `the-odyssey` assim —, vale a descrição do site,
  // do `app/layout.tsx`. Ela é lida pelo `parent`, e não simplesmente omitida:
  // o merge de metadata é raso, e o `openGraph` daqui substitui o do layout
  // inteiro — a prévia do link sairia sem descrição nenhuma.
  const sinopse = midia.sinopse ?? "";
  const pontoDoCorte = corte(sinopse);
  const descricaoCurta = !sinopse
    ? ((await parent).description ?? undefined)
    : pontoDoCorte < sinopse.length
      ? `${sinopse.slice(0, pontoDoCorte).trimEnd()}…`
      : sinopse;

  return {
    title: midia.titulo,
    description: descricaoCurta,
    openGraph: {
      title: midia.titulo,
      description: descricaoCurta,
      siteName: "LequePlay",
      type: "article",
    },
  };
}

export default async function PaginaDaMidia({
  params,
  searchParams,
}: PageProps<"/midias/[slug]"> & {
  searchParams?: Promise<SearchParams>;
}) {
  const { slug } = await params;

  const parametros = await searchParams;

  const midia = await buscarMidia(slug);

  /*
   * `buscarMidia` devolve `Midia | null`.
   *
   * Se a mídia não existir, mostramos a página 404.
   */
  if (!midia) {
    notFound();
  }

  /*
   * O botão "Retomar" envia temporada e episódio
   * pela query string.
   *
   * Exemplo:
   *
   * ?temporada=2&episodio=2
   */
  const temporadaNumero = parametros?.temporada
    ? Number(parametros.temporada)
    : undefined;

  const episodioNumero = parametros?.episodio
    ? Number(parametros.episodio)
    : undefined;

  const mostrarTodosEpisodios = parametros?.episodios === "todos";

  return (
    <article>
      <nav
        aria-label="Trilha"
        className="mb-6 text-sm"
      >
        <Link
          href="/midias"
          className="text-zinc-400 hover:text-zinc-100"
        >
          ← Voltar ao catálogo
        </Link>
      </nav>

      <CabecalhoDaMidia midia={midia} />

      {midia.tipo === "podcast" ? (
        <FichaPodcast
          podcast={midia}
          mostrarTodosEpisodios={mostrarTodosEpisodios}
        />
      ) : (
        <>
          <FichaAbas midia={midia} />

          {midia.tipo === "serie" && (
            <FichaTemporadas
              serie={midia}
              temporadaNumero={temporadaNumero}
              episodioNumero={episodioNumero}
            />
          )}
        </>
      )}

      {/*
        O slug vai junto porque, sem sessão, o bloco oferece o login com o
        caminho de volta para esta ficha (`?de=/midias/<slug>`).
      */}
      <FichaResenha titulo={midia.titulo} slug={midia.slug} />

      <FichaCompartilhar
        slug={midia.slug}
        titulo={midia.titulo}
      />
    </article>
  );
}