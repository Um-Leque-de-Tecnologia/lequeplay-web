/**
 * As etiquetas de cache do LequePlay, num lugar só.
 *
 * Elas existem para a invalidação ser cirúrgica: `revalidateTag("midias")`
 * derruba o catálogo inteiro, enquanto `revalidateTag("midia:reacher")`
 * derruba só a ficha daquele título. Sem o esquema, sobra a escolha ruim —
 * ou esperar o tempo de revalidação passar, ou limpar tudo a cada edição.
 *
 * Por que constantes, e não a string solta em cada busca: etiqueta é um
 * acordo entre quem **grava** o cache (`lib/api.ts`) e quem **invalida**
 * (a rota `/api/revalidar`). Os dois lados precisam escrever exatamente a
 * mesma palavra, e `"midias"` digitado de novo em cada arquivo é onde nasce
 * o `"midia"` sem `s` que ninguém percebe — a invalidação simplesmente não
 * acontece, e não há erro nenhum para avisar.
 *
 * O esquema completo, com o que cada etiqueta invalida, está em
 * `docs/cache-tags.md`.
 */
export const CACHE_TAGS = {
  /** O catálogo inteiro: listagem, busca e qualquer ficha. */
  MIDIAS: "midias",
  /** A lista de gêneros, que muda quando entra título de gênero novo. */
  GENEROS: "generos",
} as const;

/**
 * A etiqueta de uma ficha específica: `midia:reacher`.
 *
 * O slug entra no nome da etiqueta, e não o id, porque quem invalida costuma
 * ter em mãos o endereço que mudou — o mesmo slug que aparece na URL.
 */
export function tagMidia(slug: string): string {
  return `midia:${slug}`;
}
