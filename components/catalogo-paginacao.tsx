"use client";

import Link from "next/link";
import {
  usePathname,
  useSearchParams,
  type ReadonlyURLSearchParams,
} from "next/navigation";

// A mesma cara dos botões secundários do catálogo ("Limpar filtros", o
// "Ordenar por"), com o contorno de foco dos chips de gênero.
const CLASSE_LINK =
  "inline-flex items-center gap-1.5 rounded-md border border-white/15 px-3 py-2 text-sm text-zinc-300 transition hover:border-violet-500 hover:text-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400";

/**
 * O endereço de outra página do catálogo, com o resto da URL como estava.
 *
 * Parte da query atual pelo mesmo motivo dos chips de gênero: `tipo`,
 * `genero` e `ordem` continuam valendo na página seguinte. `URLSearchParams`
 * porque um gênero como "Action & Adventure" precisa chegar inteiro, e `set`
 * porque substitui também um `?pagina=` repetido.
 *
 * A primeira página sai **sem** `?pagina=`: é o padrão, e `/midias` e
 * `/midias?pagina=1` seriam dois endereços para a mesma tela.
 *
 * Trocar de filtro é o caminho inverso — o chip de gênero apaga o
 * `?pagina=` —, porque a página 3 de um resultado não é a página 3 de outro.
 */
function enderecoDaPagina(
  pathname: string,
  atuais: ReadonlyURLSearchParams,
  pagina: number,
): string {
  const params = new URLSearchParams(atuais.toString());

  if (pagina > 1) {
    params.set("pagina", String(pagina));
  } else {
    params.delete("pagina");
  }

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

type Props = {
  /** A página que a API devolveu. */
  pagina: number;
  totalDePaginas: number;
};

/**
 * Os links para a página anterior e a seguinte, embaixo da grade (LP-604).
 *
 * Links, e não botões: a página mora na URL (`?pagina=`), então mudar de
 * página é navegar. O F5 fica na mesma página, o link compartilhado leva a
 * ela, e o "voltar" do navegador volta uma página.
 *
 * Client Component só por causa do `useSearchParams`, como os chips: a ordem
 * da grade muda a URL com `pushState`, e um link montado no servidor
 * esqueceria o `?ordem=` escolhido depois.
 *
 * Anterior e próxima, e não um número por página: com 20 por página, o
 * catálogo inteiro dá poucas páginas, e o "Página 2 de 3" no meio já diz onde
 * a pessoa está e até onde vai.
 */
export function CatalogoPaginacao({ pagina, totalDePaginas }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <nav
      aria-label="Páginas do catálogo"
      className="mt-10 grid grid-cols-[1fr_auto_1fr] items-center gap-3"
    >
      {/* A célula existe mesmo sem link, para o "Página X de Y" ficar no
          meio na primeira e na última página também. Sem link, e não um
          link desabilitado: não há para onde ir, e o teclado não precisa
          parar ali. */}
      <div>
        {pagina > 1 && (
          <Link
            href={enderecoDaPagina(pathname, searchParams, pagina - 1)}
            rel="prev"
            className={CLASSE_LINK}
          >
            <span aria-hidden="true">←</span>
            Anterior
          </Link>
        )}
      </div>

      <p className="text-sm text-zinc-500">
        Página {pagina} de {totalDePaginas}
      </p>

      <div className="text-right">
        {pagina < totalDePaginas && (
          <Link
            href={enderecoDaPagina(pathname, searchParams, pagina + 1)}
            rel="next"
            className={CLASSE_LINK}
          >
            Próxima
            <span aria-hidden="true">→</span>
          </Link>
        )}
      </div>
    </nav>
  );
}

/**
 * O que aparece no lugar da grade numa página depois da última — um
 * `?pagina=9` digitado, ou um link guardado de quando o resultado era maior.
 *
 * Não é o "Nenhum título encontrado": os títulos existem, e a frase que diz
 * que não existem mandaria a pessoa limpar filtros que estão certos. O que
 * está errado é a página, e a saída é a última que existe.
 */
export function CatalogoPaginaInexistente({
  pagina,
  total,
  totalDePaginas,
}: Props & { total: number }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <div className="mt-10 rounded-lg border border-dashed border-white/15 p-10 text-center">
      {/* `role="status"`, como no estado vazio: o leitor de tela anuncia a
          frase quando ela aparece sem recarregar a página. */}
      <p role="status" className="text-zinc-300">
        A página {pagina} não existe.
      </p>
      <p className="mt-2 text-sm text-zinc-500">
        São {total} {total === 1 ? "título" : "títulos"}, em {totalDePaginas}{" "}
        {totalDePaginas === 1 ? "página" : "páginas"}.
      </p>

      <Link
        href={enderecoDaPagina(pathname, searchParams, totalDePaginas)}
        className={`mt-4 ${CLASSE_LINK}`}
      >
        Ir para a última página
      </Link>
    </div>
  );
}
