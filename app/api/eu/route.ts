import { NextResponse } from "next/server";
import { buscarUsuarioLogado } from "@/lib/dal";

/**
 * "Quem está aí?", para o cabeçalho perguntar do navegador.
 *
 * ## Por que este endpoint existe
 *
 * O cabeçalho mora no layout raiz, em toda página. Se ele lesse o cookie no
 * servidor, **toda rota viraria dinâmica** — inclusive `/` e `/sobre`, que
 * hoje são pré-geradas, e as temporadas do LP-303. Uma linha no cabeçalho
 * custaria o trabalho de cache da sprint inteira.
 *
 * Então a pergunta sai do servidor e vai para o navegador: a página continua
 * estática, e quem quiser saber o nome de quem entrou pede aqui.
 *
 * ## O que ele devolve, e o que ele nunca devolve
 *
 * Só `{ autenticado, nome }`. **Nem token, nem e-mail, nem papéis** — esta
 * resposta vai para o JavaScript da página, que é justamente de onde o token
 * foi tirado no LP-403. Devolver o e-mail aqui desfaria metade daquilo.
 *
 * ## `private, no-store`
 *
 * A resposta é de uma pessoa. `private` proíbe cache compartilhado (CDN,
 * proxy) de guardá-la; `no-store` proíbe guardar em qualquer lugar. Sem isso,
 * o nome de quem entrou primeiro apareceria para quem chegasse depois — é o
 * erro que o LP-411 mede com número.
 */
export async function GET() {
  const usuario = await buscarUsuarioLogado();

  return NextResponse.json(
    {
      autenticado: Boolean(usuario),
      nome: usuario?.username ?? null,
    },
    {
      headers: { "Cache-Control": "private, no-store" },
    },
  );
}
