import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buscarMidia } from "@/lib/api";
import { formatarDuracao, rotuloDaTemporada } from "@/lib/formatadores";
import type { Midia, Temporada } from "@/lib/tipos";

/**
 * A temporada, com endereço próprio.
 *
 * Antes deste card a temporada era `?temporada=2` dentro da ficha: estado de
 * tela, não endereço. Sem um endereço não dá para ter 404 de temporada
 * (LP-304), nem pré-gerar as temporadas no build (LP-303), nem manter o
 * cabeçalho da série entre uma temporada e outra (LP-302).
 *
 * O `?temporada=` continua funcionando: ele é o que o botão "Retomar" do
 * LP-116 usa para abrir a ficha já na temporada certa, com o episódio
 * destacado. Os dois endereços convivem porque respondem a perguntas
 * diferentes — "abra a série naquele ponto" e "me leve à temporada 2".
 */

/**
 * Acha a temporada pedida dentro da mídia.
 *
 * Devolve `null` em todos os caminhos em que não há temporada: a mídia não
 * existe, não é série, o número da URL não é número, ou é um número que a
 * série não tem. Quem chama decide o que fazer — e aqui a decisão é a mesma
 * para todos, porque para quem está olhando a tela eles são o mesmo caso.
 */
function acharTemporada(
  midia: Midia | null,
  numeroDaUrl: string,
): { serie: Extract<Midia, { tipo: "serie" }>; temporada: Temporada } | null {
  if (!midia || midia.tipo !== "serie") return null;

  // O segmento chega como texto e `temporada.numero` é número: sem a
  // conversão, `1 === "1"` é falso e toda temporada viraria 404. E `Number`
  // devolve `NaN` para "abc", que não casa com nada — é o caso do LP-304.
  const numero = Number(numeroDaUrl);
  if (!Number.isInteger(numero)) return null;

  const temporada = midia.temporadas.find((t) => t.numero === numero);
  if (!temporada) return null;

  return { serie: midia, temporada };
}

export async function generateMetadata({
  params,
}: PageProps<"/midias/[slug]/temporada/[numero]">): Promise<Metadata> {
  const { slug, numero } = await params;
  const achado = acharTemporada(await buscarMidia(slug), numero);

  if (!achado) return { title: "Temporada não encontrada" };

  return {
    title: `${achado.serie.titulo} · ${rotuloDaTemporada(achado.temporada)}`,
    description: achado.serie.sinopse,
  };
}

export default async function PaginaDaTemporada({
  params,
}: PageProps<"/midias/[slug]/temporada/[numero]">) {
  const { slug, numero } = await params;
  const achado = acharTemporada(await buscarMidia(slug), numero);

  // Fora do `try` e antes de qualquer Suspense: é o que mantém o status 404
  // de verdade, como no LP-204.
  if (!achado) notFound();

  const { serie, temporada } = achado;

  return (
    <article>
      <nav aria-label="Trilha" className="mb-6 text-sm">
        <Link href={`/midias/${serie.slug}`} className="text-zinc-400 hover:text-zinc-100">
          ← {serie.titulo}
        </Link>
      </nav>

      <header>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {rotuloDaTemporada(temporada)}
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          {serie.titulo}
          {temporada.ano ? ` · ${temporada.ano}` : ""} ·{" "}
          {temporada.totalEpisodios}{" "}
          {temporada.totalEpisodios === 1 ? "episódio" : "episódios"}
        </p>
      </header>

      {/*
        A API publicada não manda os episódios (é o LP-306): quando eles não
        vierem, a página mostra o que existe — número, ano e total — em vez de
        uma lista vazia sem explicação.
      */}
      {temporada.episodios.length === 0 ? (
        <p className="mt-8 text-sm text-zinc-500">
          Os episódios desta temporada ainda não foram anunciados.
        </p>
      ) : (
        <ol className="mt-8 divide-y divide-white/10 border-y border-white/10">
          {temporada.episodios.map((episodio) => (
            <li
              key={episodio.numero}
              className="flex flex-wrap items-baseline gap-x-3 py-3 text-sm"
            >
              <span className="w-6 shrink-0 text-zinc-500">
                {episodio.numero}
              </span>
              <span className="text-zinc-200">{episodio.titulo}</span>
              <span className="ml-auto text-zinc-500">
                {formatarDuracao(episodio.duracaoMin)}
              </span>
            </li>
          ))}
        </ol>
      )}

      {serie.temporadas.length > 1 && (
        <nav aria-label="Outras temporadas" className="mt-10">
          <h2 className="mb-3 text-sm font-medium text-zinc-400">
            Outras temporadas
          </h2>
          <ul className="flex flex-wrap gap-2">
            {serie.temporadas.map((outra) => {
              const atual = outra.numero === temporada.numero;

              return (
                <li key={outra.numero}>
                  <Link
                    href={`/midias/${serie.slug}/temporada/${outra.numero}`}
                    aria-current={atual ? "page" : undefined}
                    className={`inline-block rounded-full border px-3 py-1.5 text-sm transition ${
                      atual
                        ? "border-violet-500 bg-violet-600/20 font-medium text-violet-200"
                        : "border-white/15 text-zinc-300 hover:border-violet-500 hover:text-zinc-100"
                    }`}
                  >
                    {rotuloDaTemporada(outra)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </article>
  );
}
