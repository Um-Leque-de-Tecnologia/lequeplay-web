import { NextResponse, type NextRequest } from "next/server";
import { NOMES_DOS_COOKIES } from "@/lib/nomes-dos-cookies";

/**
 * O atalho de navegação das rotas da conta — **não** a autorização.
 *
 * ## O que ele é
 *
 * No Next 16 o antigo `middleware.ts` virou `proxy.ts` (arquivo e função). Ele
 * roda **antes** da página e antes de qualquer streaming, e é por isso que ele
 * existe aqui: é o único lugar que consegue responder `307` com `Location`
 * mesmo que um dia apareça um `loading.tsx` acima da rota. Sem ele, a página
 * ainda protege — mas o redirecionamento vira uma meta tag no corpo de uma
 * resposta `200`, como medimos no LP-405.
 *
 * ## O que ele não é
 *
 * A doc da versão instalada, em `01-getting-started/16-proxy.md`:
 *
 * > While Proxy can be helpful for optimistic checks such as permission-based
 * > redirects, **it should not be used as a full session management or
 * > authorization solution**.
 *
 * Por isso aqui só se pergunta se o cookie **existe**. O valor não é lido, não
 * é aberto, não é levado à API. Quem escreve `lp_acesso=qualquer-coisa` no
 * console passa por este arquivo — e é o `/perfil` que o manda de volta,
 * porque lá a pergunta é feita ao `/v1/auth/me` (LP-404). Esta checagem é um
 * atalho para quem nem cookie tem: economiza uma renderização e uma ida à API.
 *
 * O teste disso é o aceite do card: **apagar este arquivo não abre nada.**
 */
export function proxy(request: NextRequest) {
  if (request.cookies.has(NOMES_DOS_COOKIES.acesso)) {
    return NextResponse.next();
  }

  const url = new URL("/entrar", request.url);

  // O caminho pedido viaja para o login voltar a pessoa para onde ela queria
  // ir. `searchParams.set` escapa o valor sozinho — nada de concatenar texto
  // numa URL. E, do outro lado, quem valida esse destino é a action (LP-407):
  // este `de` é escrito por nós, mas lá chega um parâmetro de query qualquer,
  // vindo de um link que qualquer pessoa pode ter montado.
  url.searchParams.set(
    "de",
    request.nextUrl.pathname + request.nextUrl.search,
  );

  // `NextResponse.redirect` responde 307 — o método e o corpo do pedido são
  // preservados, que é o certo para um redirecionamento temporário.
  return NextResponse.redirect(url);
}

/**
 * Só as rotas da conta.
 *
 * Sem `matcher`, a doc é explícita: o proxy roda em **toda** requisição,
 * inclusive `_next/static`, `_next/image` e o que está em `public/` — e uma
 * regra de autenticação mal posta ali dentro deixa a página sem CSS.
 *
 * A lista é curta de propósito, e cada rota entra por um motivo:
 *
 * - `/perfil` é a rota protegida de hoje (LP-405);
 * - as telas da conta que vierem entram aqui, uma a uma.
 *
 * O que **não** está na lista continua funcionando sem passar por aqui — e é
 * bom que seja assim: o catálogo é público, e o LP-409 depende de `/` e
 * `/sobre` seguirem estáticas.
 *
 * Um detalhe que o card sublinha: Server Action é `POST` na própria rota. Se a
 * rota da action não estiver no `matcher`, ela não passa por este arquivo —
 * mais uma razão para a checagem de sessão morar dentro da action.
 */
export const config = {
  matcher: ["/perfil/:path*"],
};
