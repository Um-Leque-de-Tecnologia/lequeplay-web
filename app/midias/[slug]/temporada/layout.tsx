import Link from "next/link";
import { AbasDeTemporada } from "@/components/abas-de-temporada";
import { CabecalhoDaMidia } from "@/components/cabecalho-da-midia";
import { buscarMidia, listarMidias } from "@/lib/api";

/**
 * O que fica parado enquanto a pessoa troca de temporada (LP-302): a trilha,
 * o cabeçalho da série e as abas. Só a lista da temporada muda.
 *
 * **`layout.tsx`, e não `template.tsx`.** Os dois embrulham as páginas de
 * baixo, e a diferença é justamente o que este card pede: o layout é o mesmo
 * componente de uma temporada para outra — não remonta, e o que tem estado
 * dentro dele (a sinopse aberta no "ver mais") continua como estava. O
 * template ganha uma instância nova a cada navegação, de propósito, para
 * quem quer que algo recomece: uma animação de entrada, um efeito por página.
 *
 * **Por que em `temporada/`, e não em `[slug]/`.** Um layout em `[slug]/`
 * embrulharia também a ficha — do filme, do podcast e da série —, e a ficha
 * teria de perder o próprio cabeçalho. A ficha é importada inteira pelo modal
 * do LP-508; aqui ela continua igual, e o cabeçalho, que é o mesmo nos dois
 * lugares, mora em `CabecalhoDaMidia`.
 *
 * O layout só recebe `slug`: o `[numero]` é do segmento de baixo e não chega
 * aqui. Quem precisa saber a temporada ativa são as abas, e elas perguntam no
 * cliente.
 */
/**
 * As séries que o build pré-gera (LP-303).
 *
 * Mora no layout, e não na página da ficha: o `generateStaticParams` de um
 * segmento só passa os params para o de baixo quando está num **layout** acima
 * dele — a página `[slug]/page.tsx` é folha, irmã desta pasta, e ainda lê
 * `searchParams`, o que a deixa dinâmica de qualquer jeito.
 *
 * `listarMidias` traz a primeira página da listagem: 20 títulos, que hoje são
 * todas as séries. Se o catálogo passar disso, as de fora não quebram nada —
 * abrem sob demanda na primeira visita. Pré-gerar é adiantamento, não
 * permissão.
 */
export async function generateStaticParams() {
  const { itens } = await listarMidias({ tipo: "serie" });
  return itens.map((serie) => ({ slug: serie.slug }));
}

export default async function LayoutDasTemporadas({
  children,
  params,
}: LayoutProps<"/midias/[slug]/temporada">) {
  const { slug } = await params;

  // A mesma busca da página, deduplicada pelo `cache()` do `buscarMidia`:
  // uma ida à API por visita, e não duas.
  const midia = await buscarMidia(slug);

  // Título que não existe, ou que não é série: quem decide o 404 é a página,
  // com o `not-found.tsx` da temporada. Um `notFound()` aqui seria pego pelo
  // boundary de cima, e não por aquele.
  if (!midia || midia.tipo !== "serie") return children;

  const temporadas = (midia.temporadas ?? []).map(({ numero, nome }) => ({
    numero,
    nome,
  }));

  return (
    <article>
      <nav aria-label="Trilha" className="mb-6 text-sm">
        <Link
          href={`/midias/${midia.slug}`}
          className="text-zinc-400 hover:text-zinc-100"
        >
          ← Ficha da série
        </Link>
      </nav>

      <CabecalhoDaMidia midia={midia} />

      {temporadas.length > 0 && (
        <AbasDeTemporada slug={midia.slug} temporadas={temporadas} />
      )}

      {children}
    </article>
  );
}
