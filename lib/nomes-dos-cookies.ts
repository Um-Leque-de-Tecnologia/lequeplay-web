/**
 * Os cookies da sessão: como se chamam e com que opções são gravados.
 *
 * Este módulo existe separado do `lib/sessao.ts` por um motivo prático: o
 * `proxy.ts` também grava esses cookies (ao renovar o token, LP-410), e o
 * `lib/sessao.ts` carrega `server-only` e `next/headers` — coisas que o proxy
 * não usa e não deve arrastar. Aqui não há nada além de dois textos e um
 * objeto de opções.
 *
 * Repetir o literal `"lp_acesso"`, ou o `sameSite`, nos dois lugares
 * funcionaria até alguém mudar um e esquecer o outro. O sintoma seria
 * silencioso: o proxy deixando passar quem não tem sessão, ou gravando um
 * cookie que o resto do site não reconhece.
 */
export const NOMES_DOS_COOKIES = {
  /** O token de acesso: é ele que vai no `Authorization` das chamadas à API. */
  acesso: "lp_acesso",

  /** O token de renovação: só serve para pedir um par novo à API. */
  renovacao: "lp_renovacao",
} as const;

/**
 * `secure` só em produção.
 *
 * Em `http://localhost`, Chrome e Firefox aceitam cookie `Secure` — mas nem
 * todo navegador aceita, e um login que "não funciona" por causa disso custa
 * uma tarde. Em produção ele é obrigatório: sem `secure`, o cookie viaja em
 * texto puro se alguém abrir o site por `http`.
 */
const EM_PRODUCAO = process.env.NODE_ENV === "production";

/**
 * As opções que valem para os dois cookies, onde quer que sejam gravados.
 *
 * **`sameSite: "lax"`, e não `"strict"`.** Com `strict`, o cookie não
 * acompanha nenhuma navegação vinda de fora do site: quem clicasse num link
 * do LequePlay compartilhado no WhatsApp chegaria **deslogado**, e o site
 * mostraria "Entrar" para quem acabou de entrar. `lax` manda o cookie em
 * navegação de topo (clicar num link), e não manda em requisição de terceiro
 * — que é a proteção que interessa contra CSRF.
 *
 * O `maxAge` não está aqui porque ele é diferente para cada cookie: vem da
 * validade que a própria API informa (`expiresIn` e `refreshExpiresIn`).
 */
export const OPCOES_DO_COOKIE_DE_SESSAO = {
  httpOnly: true,
  secure: EM_PRODUCAO,
  sameSite: "lax",
  path: "/",
} as const;
