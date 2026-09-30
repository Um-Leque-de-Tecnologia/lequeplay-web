import {
  type RecusaDoPedido,
  pedirRecomendacaoEmPedacos,
  prepararRecomendacao,
} from "@/lib/recomendacao";
import type { EventoDaRecomendacao } from "@/lib/recomendacao-comum";
import type { ItemResultadoBusca } from "@/lib/tipos";

/**
 * A recomendação do `/escolher` em pedaços, à medida que o modelo escreve
 * (LP-704).
 *
 * Esperar a resposta inteira do Gemini leva uns 4,5 s; a primeira palavra
 * chega em 1,6 s. Esta rota repassa cada pedaço como evento SSE — uma linha
 * `data:` com um JSON de `EventoDaRecomendacao` — para a tela ir escrevendo.
 *
 * Só POST, pelo mesmo motivo da action (`app/escolher/acoes.ts`): cada
 * chamada gasta cota, e GET é o que prefetch, robô e link compartilhado
 * fazem sozinhos. As conferências (desligada, tamanho do pedido, sem
 * candidato) são as mesmas da action, em `prepararRecomendacao`.
 *
 *     curl -N -X POST -d "pedido=algo leve pra ver com a família" \
 *       http://localhost:3000/api/recomendar
 */

const CABECALHOS = {
  "Content-Type": "text/event-stream; charset=utf-8",
  // `no-transform`: proxy que comprime junta os pedaços e devolve tudo no
  // fim, que é justamente o que esta rota existe para não fazer.
  "Cache-Control": "private, no-store, no-transform",
  // Idem para o nginx, que guarda a resposta em buffer por padrão.
  "X-Accel-Buffering": "no",
};

const STATUS_DA_RECUSA: Record<RecusaDoPedido, number> = {
  desligada: 503,
  "pedido-invalido": 400,
  "catalogo-fora": 502,
  // Não é falha: a busca rodou e não achou nada.
  "sem-candidatos": 200,
};

const codificador = new TextEncoder();

function linha(evento: EventoDaRecomendacao): string {
  return `data: ${JSON.stringify(evento)}\n\n`;
}

/** Aceita JSON (`{"pedido": "..."}`) e formulário, que é o que o curl manda com `-d`. */
async function lerPedido(request: Request): Promise<unknown> {
  try {
    if (request.headers.get("content-type")?.includes("application/json")) {
      const corpo: unknown = await request.json();
      return typeof corpo === "object" && corpo !== null && "pedido" in corpo
        ? corpo.pedido
        : undefined;
    }
    return (await request.formData()).get("pedido");
  } catch {
    // Corpo ilegível é pedido vazio: cai na recusa de "escreva o que quer ver".
    return undefined;
  }
}

async function* eventos(
  pedido: string,
  candidatos: ItemResultadoBusca[],
  sinal: AbortSignal,
): AsyncGenerator<EventoDaRecomendacao> {
  // Primeiro a lista, para a tela saber que `[[slug]]` pode virar link. Só
  // slug e título: sinopse e o resto já foram para o modelo, e não fazem
  // falta à tela.
  yield {
    type: "candidatos",
    data: candidatos.map(({ slug, titulo }) => ({ slug, titulo })),
  };

  let jaSaiuTexto = false;
  try {
    for await (const pedaco of pedirRecomendacaoEmPedacos(pedido, candidatos, sinal)) {
      jaSaiuTexto = true;
      yield { type: "texto", data: pedaco };
    }
  } catch (erro) {
    // Quem pediu foi embora: não há a quem avisar.
    if (sinal.aborted) return;

    // O motivo real fica no log; a tela recebe uma frase. O status já saiu
    // 200 com o primeiro evento, então o erro também vai como evento.
    console.error("[api/recomendar]", erro instanceof Error ? erro.message : erro);
    yield {
      type: "erro",
      data: jaSaiuTexto
        ? "A recomendação parou no meio. Tente de novo em instantes."
        : "A recomendação não respondeu agora. Tente de novo em instantes.",
    };
    return;
  }

  yield { type: "fim" };
}

export async function POST(request: Request) {
  const preparo = await prepararRecomendacao(await lerPedido(request));

  if (!preparo.ok) {
    // Mesmo formato do caminho feliz, com um evento só: a tela lê tudo do
    // mesmo jeito, e o status diz o motivo para quem usa o curl.
    return new Response(linha({ type: "erro", data: preparo.mensagem }), {
      status: STATUS_DA_RECUSA[preparo.recusa],
      headers: CABECALHOS,
    });
  }

  // Fechar a aba cancela o stream; isto leva o cancelamento até o fetch do
  // Gemini, que para de gerar (e de gastar) em vez de terminar para ninguém.
  const parar = new AbortController();
  const sinal = AbortSignal.any([request.signal, parar.signal]);
  const fila = eventos(preparo.pedido, preparo.candidatos, sinal);

  const corpo = new ReadableStream<Uint8Array>({
    // `pull`, e não um laço no `start`: o próximo evento só é lido quando o
    // anterior foi entregue a quem pediu.
    async pull(controller) {
      const { value, done } = await fila.next();
      if (done) controller.close();
      else controller.enqueue(codificador.encode(linha(value)));
    },
    async cancel() {
      parar.abort();
      await fila.return(undefined);
    },
  });

  return new Response(corpo, { headers: CABECALHOS });
}
