import Link from "next/link";
import { endereco, type Filtros } from "@/lib/filtros";
import type { Genero } from "@/lib/tipos";

/**
 * A fileira de gêneros que fica acima da grade do catálogo.
 *
 * A lista vem de `listarGeneros()`, e não chumbada aqui: gênero novo no
 * acervo aparece no filtro sem ninguém publicar o site de novo.
 *
 * O nome vai para a tela como a API manda, já em UTF-8 (LP-602). Nenhum
 * texto vindo da API passa por conversão de codificação no front.
 */

const CLASSE_BASE =
  "inline-block rounded-full border px-3 py-1.5 text-sm transition";
const CLASSE_INATIVO =
  "border-white/15 text-zinc-300 hover:border-violet-500 hover:text-zinc-100";
const CLASSE_ATIVO =
  "border-violet-500 bg-violet-600/20 font-medium text-violet-200";

type Props = {
  generos: Genero[];
  filtros?: Filtros;
};

export function CatalogoChipsGenero({
  generos,
  filtros = { pagina: 1 },
}: Props) {
  function destinoComGenero(genero?: string): string {
    const params = endereco({
      ...filtros,
      genero,
      pagina: 1, // trocar de gênero sempre volta à primeira página
    });
    const query = params.toString();
    return query ? `/midias?${query}` : "/midias";
  }

  const generoAtivo = filtros.genero;

  return (
    // <nav> porque a fileira leva a outra listagem do catálogo — é
    // navegação, não um formulário.
    <nav aria-label="Filtrar por gênero" className="mt-6 flex flex-wrap gap-2">
      {/* "Todos" vem primeiro e fora do map: ele é a ausência de filtro,
          não um gênero do acervo. */}
      <Link
        href={destinoComGenero(undefined)}
        aria-current={!generoAtivo ? "page" : undefined}
        className={`${CLASSE_BASE} ${!generoAtivo ? CLASSE_ATIVO : CLASSE_INATIVO}`}
      >
        Todos
      </Link>

      {generos.map((genero) => {
        const ativo = generoAtivo === genero;
        return (
          // `key` é o nome cru vindo da API: ele identifica o chip, e valor de
          // identidade não passa por formatação.
          <Link
            key={genero}
            href={destinoComGenero(genero)}
            aria-current={ativo ? "page" : undefined}
            className={`${CLASSE_BASE} ${ativo ? CLASSE_ATIVO : CLASSE_INATIVO}`}
          >
            {genero}
          </Link>
        );
      })}
    </nav>
  );
}
