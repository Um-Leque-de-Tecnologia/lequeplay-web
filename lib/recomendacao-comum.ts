/**
 * O lado da recomendação que o navegador também usa (LP-704): o formato dos
 * eventos do `/api/recomendar`, a leitura de SSE e a troca de `[[slug]]` por
 * título.
 *
 * Separado de `lib/recomendacao.ts` porque aquele é `server-only` — mora lá a
 * chave do Gemini. Aqui não há nada secreto: só tipos e texto.
 */

/** O mínimo de um candidato que a tela precisa para montar o link. */
export type CandidatoDaRecomendacao = { slug: string; titulo: string };

/**
 * Um evento do `/api/recomendar`. Cada um vai numa linha `data:` do SSE, em
 * JSON, e chegam nesta ordem: `candidatos` uma vez, `texto` quantas vezes o
 * modelo mandar, e `fim` — ou `erro`, que também encerra.
 */
export type EventoDaRecomendacao =
  | { type: "candidatos"; data: CandidatoDaRecomendacao[] }
  | { type: "texto"; data: string }
  | { type: "fim" }
  | { type: "erro"; data: string };

/**
 * Lê um corpo SSE e devolve o conteúdo de cada linha `data:`. Serve aos dois
 * lados: o servidor lê o stream do Gemini com ela, e a tela, o do
 * `/api/recomendar`.
 *
 * O `TextDecoder` com `stream: true` é o que segura acento: um "ç" são dois
 * bytes, e a rede pode entregar um em cada pedaço. Sem o `stream`, cada
 * metade vira "�". Pelo mesmo motivo a linha incompleta fica em `resto` até
 * chegar o `\n` dela.
 */
export async function* lerLinhasSSE(
  corpo: ReadableStream<Uint8Array>,
): AsyncGenerator<string> {
  const decodificador = new TextDecoder();
  const leitor = corpo.getReader();
  let resto = "";

  try {
    while (true) {
      const { value, done } = await leitor.read();
      resto += done ? decodificador.decode() : decodificador.decode(value, { stream: true });

      const linhas = resto.split(/\r?\n/);
      resto = done ? "" : (linhas.pop() ?? "");

      for (const linha of linhas) {
        if (linha.startsWith("data:")) yield linha.slice(5).trimStart();
      }

      if (done) return;
    }
  } finally {
    // Quem consome pode parar antes do fim (a pessoa saiu): solta a conexão.
    leitor.cancel().catch(() => {});
  }
}

/** Um pedaço da resposta: texto corrido, ou um título citado. */
export type TrechoDaResposta =
  | { tipo: "texto"; texto: string }
  | { tipo: "titulo"; slug: string; titulo: string }
  | { tipo: "fora-do-catalogo" };

/**
 * Troca cada `[[slug]]` pelo título — **só** se o slug estava na lista.
 *
 * O prompt pede para o modelo escolher só da lista, mas pedir não é
 * garantir: modelo inventa. Quem garante é esta conferência. Slug fora da
 * lista não vira link (seria link para 404, ou para um título que a busca
 * não trouxe) e aparece marcado como fora do catálogo.
 */
export function interpretarResposta(
  texto: string,
  candidatos: CandidatoDaRecomendacao[],
): TrechoDaResposta[] {
  const porSlug = new Map(candidatos.map((m) => [m.slug, m.titulo]));
  const trechos: TrechoDaResposta[] = [];
  let desde = 0;

  for (const achado of texto.matchAll(/\[\[\s*([^\]\s]+)\s*\]\]/g)) {
    if (achado.index > desde) {
      trechos.push({ tipo: "texto", texto: texto.slice(desde, achado.index) });
    }

    const slug = achado[1];
    const titulo = porSlug.get(slug);
    trechos.push(titulo ? { tipo: "titulo", slug, titulo } : { tipo: "fora-do-catalogo" });

    desde = achado.index + achado[0].length;
  }

  if (desde < texto.length) {
    trechos.push({ tipo: "texto", texto: texto.slice(desde) });
  }

  return trechos;
}
