import { ErroDaApi } from "@/lib/api";
import { pedidoAutorizado } from "@/lib/revalidacao";
import { vigiarCatalogo } from "@/lib/vigia";

/**
 * A rota que dispara o vigia do catálogo (LP-310).
 *
 * **Quem chama:** um agendador externo — o cron da hospedagem, um serviço de
 * monitoramento, ou uma pessoa com `curl` enquanto nada disso existe. O
 * intervalo é decisão de operação, não de código, e por isso ele não está
 * escrito aqui: o que este arquivo garante é que verificar **é barato** e que
 * invalidar só acontece quando a versão mudou.
 *
 * **POST, e com a mesma tranca do `/api/revalidar`:** a verificação é barata,
 * mas ela solta cache do site inteiro quando encontra versão nova. Um GET
 * aberto seria um botão de "derrube o cache de todo mundo" no ar, disparável
 * por qualquer robô que siga links.
 */
export async function POST(pedido: Request) {
  if (!pedidoAutorizado(pedido)) {
    return new Response(null, { status: 401 });
  }

  try {
    const resultado = await vigiarCatalogo();

    return Response.json({
      ...resultado,
      em: new Date().toISOString(),
    });
  } catch (erro) {
    // A API fora do ar não é erro do vigia: ele tenta de novo na próxima
    // verificação. O status diz que a falha veio de fora, e o log fica com o
    // detalhe — que não vai para a resposta.
    const status = erro instanceof ErroDaApi ? 502 : 500;
    console.error("[vigia] não consegui ler a versão do catálogo", erro);

    return Response.json(
      { erro: "Não foi possível ler a versão do catálogo." },
      { status },
    );
  }
}
