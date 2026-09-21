import { VoltarParaASerie } from "@/components/voltar-para-a-serie";

/**
 * A tela de temporada não encontrada.
 *
 * Mora no nível da temporada, e não no da série: a de cima (LP-204) diz "não
 * encontramos esse título", que é mentira quando a série existe e só o número
 * da temporada está errado. O caminho de volta, pelo mesmo motivo, é a série
 * — e não a home, que faria a pessoa recomeçar a navegação do zero.
 */
export default function TemporadaNaoEncontrada() {
  return (
    <section className="mx-auto max-w-2xl py-16 text-center">
      <p className="text-sm font-medium uppercase tracking-wide text-violet-300">
        404
      </p>

      <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
        Esta temporada não existe
      </h1>

      <p className="mx-auto mt-4 max-w-prose text-zinc-400">
        O número pode estar errado, ou esta temporada ainda não entrou no
        catálogo. A série continua onde estava.
      </p>

      <VoltarParaASerie />
    </section>
  );
}
