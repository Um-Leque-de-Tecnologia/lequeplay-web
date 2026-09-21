import { NextResponse, type NextRequest } from "next/server";
import { renovarSessao } from "@/lib/api";
import {
  NOMES_DOS_COOKIES,
  OPCOES_DO_COOKIE_DE_SESSAO,
} from "@/lib/nomes-dos-cookies";

/**
 * O atalho de navegação das rotas da conta — **não** a autorização.
 *
 * ## O que ele é
 *
 * No Next 16 o antigo `middleware.ts` virou `proxy.ts` (arquivo e função). Ele
 * roda **antes** da página e antes de qualquer streaming, e é por isso que ele
 * existe aqui:
 *
 * 1. consegue responder `307` com `Location` mesmo que um dia apareça um
 *    `loading.tsx` acima da rota (medido no LP-406: sem ele, o mesmo caso
 *    vira `200` com uma meta tag de refresh no corpo);
 * 2. é o único lugar que roda antes da página **e ainda grava cookie** — e é
 *    disso que a renovação precisa (LP-410).
 *
 * ## O que ele não é
 *
 * A doc da versão instalada, em `01-getting-started/16-proxy.md`:
 *
 * > While Proxy can be helpful for optimistic checks such as permission-based
 * > redirects, **it should not be used as a full session management or
 * > authorization solution**.
 *
 * Por isso a conferência de verdade continua sendo do `/perfil`, que pergunta
 * ao `/v1/auth/me` (LP-404/LP-405). Quem escreve `lp_acesso=qualquer-coisa` no
 * console passa por este arquivo e é recusado lá. **Apagar este arquivo não
 * abre nada** — é o aceite do LP-406, e continua valendo.
 */
export async function proxy(request: NextRequest) {
  // Tem token de acesso: nada a fazer aqui. Quem confere se ele vale é a
  // página.
  if (request.cookies.has(NOMES_DOS_COOKIES.acesso)) {
    return NextResponse.next();
  }

  const tokenDeRenovacao = request.cookies.get(
    NOMES_DOS_COOKIES.renovacao,
  )?.value;

  // Sem nada nas mãos: login.
  if (!tokenDeRenovacao) return paraOLogin(request);

  /*
    Aqui está o caso que o LP-410 descreve: o token de acesso vence em
    minutos (o padrão do Keycloak é 300 segundos), o cookie dele some sozinho
    quando o `maxAge` acaba — e o de renovação, que vive mais, continua ali.
    Sem este bloco, a pessoa seria mandada ao login no meio do uso com uma
    renovação válida guardada ao lado.
  */
  try {
    const tokens = await renovarSessao(tokenDeRenovacao);

    /*
      O token novo precisa chegar em DOIS lugares:

      1. no navegador, para os próximos pedidos — `resposta.cookies.set`;
      2. na página **deste mesmo pedido**, que já está a caminho e leria o
         cookie antigo (isto é, nenhum) e mandaria a pessoa ao login mesmo
         depois de a renovação ter dado certo.

      O (2) se resolve reescrevendo o cabeçalho `Cookie` do pedido e passando
      por `NextResponse.next({ request: { headers } })`. A doc é explícita
      sobre a diferença: `next({ request: { headers } })` entrega para quem
      está acima; `next({ headers })` entregaria para o cliente.
    */
    const cabecalhos = new Headers(request.headers);
    cabecalhos.set("cookie", cookieComOsTokensNovos(request, tokens));

    const resposta = NextResponse.next({ request: { headers: cabecalhos } });

    resposta.cookies.set(NOMES_DOS_COOKIES.acesso, tokens.accessToken, {
      ...OPCOES_DO_COOKIE_DE_SESSAO,
      maxAge: tokens.expiresIn,
    });

    resposta.cookies.set(NOMES_DOS_COOKIES.renovacao, tokens.refreshToken, {
      ...OPCOES_DO_COOKIE_DE_SESSAO,
      maxAge: tokens.refreshExpiresIn,
    });

    return resposta;
  } catch (erro) {
    /*
      Renovação recusada (o token de renovação também venceu, ou já foi usado)
      ou API fora do ar. Nos dois casos o cookie de renovação é apagado: sem
      isso, **todo** pedido seguinte tentaria renovar de novo e falharia de
      novo — uma ida à API por clique, para nada.
    */
    console.error("Não consegui renovar a sessão", erro);

    const resposta = paraOLogin(request);
    resposta.cookies.delete(NOMES_DOS_COOKIES.renovacao);
    return resposta;
  }
}

/** O 307 para a tela de entrar, guardando de onde a pessoa veio. */
function paraOLogin(request: NextRequest) {
  const url = new URL("/entrar", request.url);

  // `searchParams.set` escapa o valor sozinho — nada de concatenar texto numa
  // URL. Do outro lado, quem valida esse destino é o filtro do LP-407: este
  // `de` é escrito por nós, mas lá chega um parâmetro de query qualquer.
  url.searchParams.set(
    "de",
    request.nextUrl.pathname + request.nextUrl.search,
  );

  // `NextResponse.redirect` responde 307: método e corpo preservados.
  return NextResponse.redirect(url);
}

/** O cabeçalho `Cookie` do pedido, com os tokens novos no lugar dos velhos. */
function cookieComOsTokensNovos(
  request: NextRequest,
  tokens: { accessToken: string; refreshToken: string },
) {
  const outros = request.cookies
    .getAll()
    .filter(
      ({ name }) =>
        name !== NOMES_DOS_COOKIES.acesso &&
        name !== NOMES_DOS_COOKIES.renovacao,
    )
    .map(({ name, value }) => `${name}=${value}`);

  return [
    ...outros,
    `${NOMES_DOS_COOKIES.acesso}=${tokens.accessToken}`,
    `${NOMES_DOS_COOKIES.renovacao}=${tokens.refreshToken}`,
  ].join("; ");
}

/**
 * Só as rotas da conta.
 *
 * Sem `matcher`, a doc é explícita: o proxy roda em **toda** requisição,
 * inclusive `_next/static`, `_next/image` e o que está em `public/` — e uma
 * regra de autenticação mal posta ali dentro deixa a página sem CSS.
 *
 * O que **não** está na lista continua funcionando sem passar por aqui — e é
 * bom que seja assim: o catálogo é público, e o LP-409 depende de `/` e
 * `/sobre` seguirem estáticas.
 *
 * Um detalhe que o card sublinha, e que a doc confirma em `Execution order`:
 * Server Action é `POST` na própria rota, e um `matcher` que não cobre a rota
 * **pula** a action também. Mais uma razão para a checagem de sessão morar
 * dentro da action.
 */
export const config = {
  matcher: ["/perfil/:path*"],
};
