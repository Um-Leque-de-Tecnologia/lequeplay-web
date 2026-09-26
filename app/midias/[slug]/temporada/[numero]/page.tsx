import type { Metadata } from "next";
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

  // `?? []`: só o detalhe traz `temporadas` (LP-212). Série sem a lista é o
  // mesmo caso de temporada que não existe.
  const temporada = (midia.temporadas ?? []).find((t) => t.numero === numero);
  if (!temporada) return null;

  return { serie: midia, temporada };
}

/**
 * As temporadas de cada série que o layout pré-gerou (LP-303).
 *
 * Roda uma vez por `slug` que o `generateStaticParams` do layout devolveu, e
 * recebe esse slug pronto em `params` — objeto comum, e não Promise, como na
 * página.
 *
 * Os dois cuidados do card:
 * - a chave se chama `numero`, igual à pasta `[numero]`. Com outro nome o
 *   build não reclama: simplesmente não gera nada;
 * - o valor é **texto**. O segmento da URL é sempre string, e `numero` na API
 *   é número.
 */
export async function generateStaticParams({
  params,
}: {
  params: { slug: string };
}) {
  const midia = await buscarMidia(params.slug);
  if (midia?.tipo !== "serie") return [];

  return (midia.temporadas ?? []).map((temporada) => ({
    numero: String(temporada.numero),
  }));
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

  const { temporada } = achado;

  // A API publicada não manda `episodios` na temporada — a chave nem existe.
  // A decisão sobre o que fazer com isso é do LP-306; este `?? []` é só o
  // mínimo para esta página, que o build pré-gera (LP-303), não derrubar o
  // build inteiro com `USAR_MOCK=false`: sem ele, a primeira temporada da API
  // quebra o `next build` com "Cannot read properties of undefined".
  const episodios = temporada.episodios ?? [];

  // A trilha, o cabeçalho da série e as abas moram no layout (LP-302): a
  // página é só o que muda de uma temporada para outra.
  return (
    <section aria-labelledby="titulo-da-temporada" className="mt-8">
      <h2 id="titulo-da-temporada" className="text-xl font-semibold">
        {rotuloDaTemporada(temporada)}
      </h2>
      <p className="mt-1 text-sm text-zinc-500">
        {temporada.ano ? `${temporada.ano} · ` : ""}
        {temporada.totalEpisodios}{" "}
        {temporada.totalEpisodios === 1 ? "episódio" : "episódios"}
      </p>

      {/*
        A API publicada não manda os episódios (é o LP-306): quando eles não
        vierem, a página mostra o que existe — número, ano e total — em vez de
        uma lista vazia sem explicação.
      */}
      {episodios.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-500">
          Os episódios desta temporada ainda não foram anunciados.
        </p>
      ) : (
        <ol className="mt-6 divide-y divide-white/10 border-y border-white/10">
          {episodios.map((episodio) => (
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
    </section>
  );
}
