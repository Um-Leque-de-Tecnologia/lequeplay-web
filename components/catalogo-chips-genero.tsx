"use client";

import Link from "next/link";
import {
  usePathname,
  useSearchParams,
  type ReadonlyURLSearchParams,
} from "next/navigation";
import type { Genero } from "@/lib/tipos";

// Constantes e não a classe repetida em cada chip: são vários links com a
// mesma aparência, e "mudar a cor do chip" tem que ser uma edição só.
const CLASSE_CHIP =
  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400";
// Fundo sólido e letra branca, como o botão "Buscar": é o par que se lê nos
// dois temas. O `violet-200` sobre `violet-600/20` das abas de temporada some
// no tema claro — ainda há cor cravada no site, e trocá-las por tokens é
// outro ticket.
const CLASSE_CHIP_ATUAL =
  "border-violet-600 bg-violet-600 font-medium text-white";
const CLASSE_CHIP_OUTRO =
  "border-white/15 text-zinc-300 hover:border-violet-500 hover:text-zinc-100";

type Props = {
  generos: Genero[];
  /**
   * O gênero que está valendo, já conferido pela página
   * (`lerFiltrosDoCatalogo`, LP-606). Vem de lá, e não de um
   * `searchParams.get("genero")` aqui: um `?genero=` repetido com valores
   * diferentes não vale nenhum, e o chip marcado tem que ser o filtro que a
   * grade aplicou — não uma segunda leitura da URL que discorde dela.
   */
  generoAtual?: string;
};

/**
 * O endereço do catálogo com outro gênero — ou sem gênero nenhum.
 *
 * Parte da query atual, e não de um objeto montado aqui, para manter o que
 * já estava na URL: `tipo`, `q`, `ordem`, e o que mais vier depois.
 *
 * `URLSearchParams`, e não texto colado: três gêneros da API têm `&` no nome
 * (*Action & Adventure*, *Sci-Fi & Fantasy*, *War & Politics*). Colado à mão,
 * `?genero=Action & Adventure` chega à página como `genero=Action ` mais um
 * parâmetro ` Adventure` sem valor. O `URLSearchParams` escreve
 * `genero=Action+%26+Adventure`, e o nome volta inteiro.
 *
 * `set`, e não `append`: substitui todos os `genero` que estiverem na URL,
 * inclusive os repetidos que o LP-606 ignora.
 */
function enderecoComGenero(
  pathname: string,
  atuais: ReadonlyURLSearchParams,
  genero: string | undefined,
): string {
  const params = new URLSearchParams(atuais.toString());

  if (genero) {
    params.set("genero", genero);
  } else {
    params.delete("genero");
  }

  // Filtro novo, resultado novo: a página 3 de "todos" não é a página 3 de
  // "Drama", e pode nem existir. O `?pagina=` ainda não é usado pela grade —
  // os links de página e a regra inteira são do LP-604 —, mas um chip que
  // levasse a página adiante deixaria para ele um endereço que já nasce
  // errado.
  params.delete("pagina");

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

/**
 * A fileira de gêneros que fica acima da grade do catálogo.
 *
 * A lista vem de `listarGeneros()`, e não chumbada aqui: gênero novo no
 * acervo aparece no filtro sem ninguém publicar o site de novo.
 *
 * O nome vai para a tela como a API manda, já em UTF-8 (LP-602). Nenhum
 * texto vindo da API passa por conversão de codificação no front.
 *
 * Cada chip é um **link**, e não um botão com `onClick`: o filtro mora na URL
 * (`?genero=`), então filtrar é navegar. O F5 mantém o filtro, o link
 * compartilhado leva junto, e o "voltar" do navegador desfaz — sem nenhuma
 * linha a mais.
 *
 * Client Component só por causa do `useSearchParams`. A ordem da grade muda a
 * URL com `pushState`, sem refazer a página no servidor (`CatalogoGrade`):
 * links montados no servidor ficariam com a query de antes, e escolher um
 * gênero depois de "A-Z" perderia o `?ordem=az`. Lendo a URL aqui, os links
 * acompanham.
 */
export function CatalogoChipsGenero({ generos, generoAtual }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    // <nav> porque a fileira leva a outra listagem do catálogo — é
    // navegação, não um formulário.
    <nav aria-label="Filtrar por gênero" className="mt-6 flex flex-wrap gap-2">
      {/* "Todos" vem primeiro e fora do map: ele é a ausência de filtro,
          não um gênero do acervo. */}
      <ChipGenero
        href={enderecoComGenero(pathname, searchParams, undefined)}
        atual={!generoAtual}
      >
        Todos
      </ChipGenero>

      {generos.map((genero) => (
        // `key` é o nome cru vindo da API: ele identifica o chip, e valor de
        // identidade não passa por formatação.
        <ChipGenero
          key={genero}
          href={enderecoComGenero(pathname, searchParams, genero)}
          atual={genero === generoAtual}
        >
          {genero}
        </ChipGenero>
      ))}
    </nav>
  );
}

function ChipGenero({
  href,
  atual,
  children,
}: {
  href: string;
  atual: boolean;
  children: string;
}) {
  return (
    <Link
      href={href}
      // `aria-current` é o que o leitor de tela anuncia ("página atual"):
      // a cor sozinha não diz a ninguém qual é o filtro que está valendo.
      aria-current={atual ? "page" : undefined}
      className={`${CLASSE_CHIP} ${atual ? CLASSE_CHIP_ATUAL : CLASSE_CHIP_OUTRO}`}
    >
      {/* E para quem vê, além da cor: o visto e o peso da letra. O ícone é
          `aria-hidden` porque o `aria-current` já disse o mesmo — lido duas
          vezes, viraria "visto, Drama, página atual". */}
      {atual && (
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-3.5"
        >
          <path d="M3 8.5 6.5 12 13 4.5" />
        </svg>
      )}
      {children}
    </Link>
  );
}
