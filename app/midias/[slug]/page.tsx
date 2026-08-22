import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buscarMidia } from "@/lib/api";
import { duracaoTotalMin, type Midia } from "@/lib/tipos";

export async function generateMetadata({
  params,
}: PageProps<"/midias/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const midia = await buscarMidia(slug);

  if (!midia) return { title: "Título não encontrado" };

  return {
    title: midia.titulo,
    description: midia.sinopse,
  };
}

function formatarDuracao(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h${m > 0 ? ` ${m}min` : ""}` : `${m}min`;
}

/** A ficha muda conforme o tipo — e o narrowing dá o campo certo em cada caso. */
function FichaTecnica({ midia }: { midia: Midia }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
      <dt className="text-zinc-500">Ano</dt>
      <dd>{midia.ano}</dd>

      <dt className="text-zinc-500">Gênero</dt>
      <dd>{midia.genero}</dd>

      <dt className="text-zinc-500">Duração</dt>
      <dd>{formatarDuracao(duracaoTotalMin(midia))}</dd>

      {midia.tipo === "filme" && (
        <>
          <dt className="text-zinc-500">Direção</dt>
          <dd>{midia.diretor}</dd>
        </>
      )}

      {midia.tipo === "serie" && (
        <>
          <dt className="text-zinc-500">Temporadas</dt>
          <dd>{midia.temporadas.length}</dd>
        </>
      )}

      {midia.tipo === "podcast" && (
        <>
          <dt className="text-zinc-500">Apresentação</dt>
          <dd>{midia.apresentador}</dd>
        </>
      )}
    </dl>
  );
}

export default async function PaginaDaMidia({
  params,
}: PageProps<"/midias/[slug]">) {
  const { slug } = await params;
  const midia = await buscarMidia(slug);

  // `buscarMidia` devolve `Midia | null`, então o TypeScript obriga a tratar
  // o caso "não achei" — que na tela vira o 404.
  if (!midia) notFound();

  return (
    <article>
      <nav aria-label="Trilha" className="mb-6 text-sm">
        <Link href="/midias" className="text-zinc-400 hover:text-zinc-100">
          ← Voltar ao catálogo
        </Link>
      </nav>

      <div className="grid gap-8 sm:grid-cols-[240px_1fr]">
        <Image
          src={midia.capaUrl}
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
            {midia.notaMedia !== null
              ? `★ ${midia.notaMedia.toFixed(1)} · ${midia.totalAvaliacoes} avaliações`
              : "Ainda sem avaliações"}
          </p>

          <p className="mt-5 max-w-prose text-zinc-300">{midia.sinopse}</p>

          <div className="mt-8">
            <FichaTecnica midia={midia} />
          </div>
        </div>
      </div>

      {/*
        TODO (sprint 1): a navegação de temporada e episódio ainda não existe.
        Ela vira /midias/[slug]/t/[temporada]/ep/[episodio].
      */}
      {midia.tipo === "serie" && (
        <section aria-labelledby="temporadas" className="mt-12">
          <h2 id="temporadas" className="mb-4 text-xl font-semibold">
            Temporadas
          </h2>
          <ul className="space-y-2 text-sm text-zinc-400">
            {midia.temporadas.map((t) => (
              <li key={t.numero}>
                Temporada {t.numero} ({t.ano}) — {t.episodios.length} episódios
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
