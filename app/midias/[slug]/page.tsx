import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CapaMidia } from "@/components/capa-midia";
import { FichaAbas } from "@/components/ficha-abas";
import { FichaCompartilhar } from "@/components/ficha-compartilhar";
import { FichaPodcast } from "@/components/ficha-podcast";
import { FichaResenha } from "@/components/ficha-resenha";
import { FichaSinopse } from "@/components/ficha-sinopse";
import { FichaTemporadas } from "@/components/ficha-temporadas";
import { notaFormatada, temAvaliacoes } from "@/lib/avaliacao";
import { buscarMidia } from "@/lib/api";
import {
  desmarcarComoAssistida,
  marcarComoAssistida,
} from "@/app/midias/[slug]/acoes";
import { listarAssistidas } from "@/lib/assistidas";
import { corte } from "@/lib/utils";

type SearchParams = {
  temporada?: string;
  episodio?: string;
  episodios?: string;
};

export async function generateMetadata({
  params,
}: PageProps<"/midias/[slug]">): Promise<Metadata> {
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
  const pontoDoCorte = corte(midia.sinopse);
  const descricaoCurta =
    pontoDoCorte < midia.sinopse.length
      ? `${midia.sinopse.slice(0, pontoDoCorte).trimEnd()}…`
      : midia.sinopse;

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

  const jaFoiAssistida = (await listarAssistidas()).includes(midia.slug);

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

      <div className="grid gap-8 sm:grid-cols-[240px_1fr]">
        <CapaMidia
          posterUrl={midia.posterUrl}
          className="w-full rounded-lg border border-white/10"
          priority
        />

        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {midia.titulo}
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            {/* A ficha tem espaço para o convite; o cartão da grade, não.
                A nota, porém, sai da mesma função nos dois lugares. */}
            {temAvaliacoes(midia)
              ? `★ ${notaFormatada(midia)} · ${midia.totalAvaliacoes} avaliações`
              : "Título ainda não avaliado. Seja a primeira pessoa a avaliar."}
          </p>

          <FichaSinopse sinopse={midia.sinopse} />

          {jaFoiAssistida ? (
            <form action={desmarcarComoAssistida} className="mt-6">
              <input type="hidden" name="slug" value={midia.slug} />
              <button
                type="submit"
                className="rounded-md border border-white/15 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-violet-500 hover:text-white"
              >
                Desmarcar como já assistido
              </button>
            </form>
          ) : (
            <form action={marcarComoAssistida} className="mt-6">
              <input type="hidden" name="slug" value={midia.slug} />
              <button
                type="submit"
                className="rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-500"
              >
                Já assisti
              </button>
            </form>
          )}
        </div>
      </div>

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