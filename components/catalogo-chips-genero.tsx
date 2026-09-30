import Link from "next/link";
import { endereco, type FiltrosLidos } from "@/lib/filtros-catalogo";
import type { Genero } from "@/lib/tipos";

// Uma constante e não a classe repetida em cada chip: são vários links com a
// mesma aparência, e "mudar a cor do chip" tem que ser uma edição só.
// O atual não se marca só pela cor: `aria-current` e o peso da fonte.
const CLASSE_CHIP =
  "rounded-full border border-white/15 px-3 py-1.5 text-sm text-zinc-300 transition hover:border-violet-500 hover:text-zinc-100 aria-[current=page]:border-violet-500 aria-[current=page]:bg-violet-600/20 aria-[current=page]:font-medium aria-[current=page]:text-violet-200";

/**
 * A fileira de gêneros que fica acima da grade do catálogo.
 *
 * A lista vem de `listarGeneros()`, e não chumbada aqui: gênero novo no
 * acervo aparece no filtro sem ninguém publicar o site de novo.
 *
 * Cada chip é um link. O gênero escolhido mora na URL (`?genero=`), então
 * recarregar, voltar e colar o endereço continuam no mesmo filtro — sem
 * estado no navegador. "Todos" é a ausência de `genero`, e leva junto o que
 * já estava no endereço (`tipo`, `q`, `ordem`).
 *
 * O nome vai para a tela como a API manda, já em UTF-8 (LP-602). Nenhum
 * texto vindo da API passa por conversão de codificação no front. O `&` do
 * nome é escapado por `URLSearchParams` dentro de `endereco`.
 */
export function CatalogoChipsGenero({
  generos,
  filtros,
}: {
  generos: Genero[];
  filtros: FiltrosLidos;
}) {
  return (
    // <nav> porque a fileira leva a outra listagem do catálogo — é
    // navegação, não um formulário.
    <nav aria-label="Filtrar por gênero" className="mt-6 flex flex-wrap gap-2">
      {/* "Todos" vem primeiro e fora do map: ele é a ausência de filtro,
          não um gênero do acervo. */}
      <Link
        href={endereco({ ...filtros, genero: undefined })}
        aria-current={filtros.genero ? undefined : "page"}
        className={CLASSE_CHIP}
      >
        Todos
      </Link>

      {generos.map((genero) => (
        // `key` é o nome cru vindo da API: ele identifica o chip, e valor de
        // identidade não passa por formatação.
        <Link
          key={genero}
          href={endereco({ ...filtros, genero })}
          aria-current={genero === filtros.genero ? "page" : undefined}
          className={CLASSE_CHIP}
        >
          {genero}
        </Link>
      ))}
    </nav>
  );
}
