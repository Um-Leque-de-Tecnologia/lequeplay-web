import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FichaAbas } from "@/components/ficha-abas";
import { FichaCompartilhar } from "@/components/ficha-compartilhar";
import { FichaResenha } from "@/components/ficha-resenha";
import { FichaSinopse } from "@/components/ficha-sinopse";
import { FichaTemporadas } from "@/components/ficha-temporadas";
import { buscarMidia } from "@/lib/api";

type SearchParams = {
  temporada?: string;
  episodio?: string;
};

export async function generateMetadata({
  params,
}: PageProps<"/midias/[slug]">): Promise<Metadata> {
  const { slug } = await params;

  const midia = await buscarMidia(slug);

  if (!midia) {
    return {
      title: "Título não encontrado",
    };
  }

  return {
    title: midia.titulo,
    description: midia.sinopse,
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
        <Image
          src={
            midia.posterUrl ??
            "/capas/sem-capa.svg"
          }
          alt=""
          width={300}
          height={450}
          className="w-full rounded-lg border border-white/10"
          priority
        />

        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {midia.titulo}
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            {midia.totalAvaliacoes === 0
              ? "Título ainda não avaliado. Seja a primeira pessoa a avaliar."
              : `★ ${midia.notaMedia.toFixed(1)} · ${midia.totalAvaliacoes} avaliações`}
          </p>

          <FichaSinopse midia={midia} />
        </div>
      </div>

      <FichaAbas midia={midia} />

      {midia.tipo === "serie" && (
        <FichaTemporadas
          serie={midia}
          temporadaNumero={temporadaNumero}
          episodioNumero={episodioNumero}
        />
      )}

      <FichaResenha titulo={midia.titulo} />

      <FichaCompartilhar
        slug={midia.slug}
        titulo={midia.titulo}
      />
    </article>
  );
}