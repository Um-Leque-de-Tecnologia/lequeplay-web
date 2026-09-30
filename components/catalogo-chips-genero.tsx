import type { Genero } from "@/lib/tipos";

// Uma constante e não a classe repetida em cada chip: são vários botões com a
// mesma aparência, e "mudar a cor do chip" tem que ser uma edição só.
const CLASSE_CHIP =
  "rounded-full border border-white/15 px-3 py-1.5 text-sm text-zinc-300 transition hover:border-violet-500 hover:text-zinc-100";

/**
 * A fileira de gêneros que fica acima da grade do catálogo.
 *
 * A lista vem de `listarGeneros()`, e não chumbada aqui: gênero novo no
 * acervo aparece no filtro sem ninguém publicar o site de novo.
 *
 * O nome vai para a tela como a API manda, já em UTF-8 (LP-602). Nenhum
 * texto vindo da API passa por conversão de codificação no front.
 */
export function CatalogoChipsGenero({ generos }: { generos: Genero[] }) {
  return (
    // <nav> porque a fileira leva a outra listagem do catálogo — é
    // navegação, não um formulário.
    <nav aria-label="Filtrar por gênero" className="mt-6 flex flex-wrap gap-2">
      {/* "Todos" vem primeiro e fora do map: ele é a ausência de filtro,
          não um gênero do acervo. */}
      <button type="button" className={CLASSE_CHIP}>
        Todos
      </button>

      {generos.map((genero) => (
        // `key` é o nome cru vindo da API: ele identifica o chip, e valor de
        // identidade não passa por formatação.
        <button key={genero} type="button" className={CLASSE_CHIP}>
          {genero}
        </button>
      ))}
    </nav>
  );
}
