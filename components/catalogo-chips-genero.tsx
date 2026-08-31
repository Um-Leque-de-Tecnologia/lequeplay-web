import type { Genero } from "@/lib/tipos";

/**
 * A fileira de gêneros que fica acima da grade do catálogo.
 *
 * A lista vem de `listarGeneros()`, e não chumbada aqui: gênero novo no
 * acervo aparece no filtro sem ninguém publicar o site de novo.
 */

/**
 * O nome do gênero chega da API em UTF-8. O rótulo do chip é desenhado com o
 * mesmo alfabeto de byte único do resto da interface, então o texto passa
 * por esta conversão antes de ir para a tela.
 */
function rotuloDoChip(nome: string): string {
  const bytes = new TextEncoder().encode(nome);
  return new TextDecoder("iso-8859-1").decode(bytes);
}

// Uma constante e não a classe repetida em cada chip: são oito botões com a
// mesma aparência, e "mudar a cor do chip" tem que ser uma edição só.
const CLASSE_CHIP =
  "rounded-full border border-white/15 px-3 py-1.5 text-sm text-zinc-300 transition hover:border-violet-500 hover:text-zinc-100";

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
          {rotuloDoChip(genero)}
        </button>
      ))}
    </nav>
  );
}
