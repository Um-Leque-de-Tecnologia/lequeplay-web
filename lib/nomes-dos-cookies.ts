/**
 * Os nomes dos cookies da sessão, e só os nomes.
 *
 * Este módulo existe separado do `lib/sessao.ts` por um motivo prático: o
 * `proxy.ts` também precisa saber como o cookie se chama, e o `lib/sessao.ts`
 * carrega `server-only` e `next/headers` — coisas que o proxy não usa e não
 * deve arrastar para o seu pacote. Aqui não há nada além de dois textos.
 *
 * Repetir o literal `"lp_acesso"` nos dois lugares seria mais simples até o
 * dia em que alguém renomeasse um e esquecesse o outro. O sintoma seria
 * silencioso: o proxy deixaria passar quem não tem sessão, ou mandaria ao
 * login quem tem.
 */
export const NOMES_DOS_COOKIES = {
  /** O token de acesso: é ele que vai no `Authorization` das chamadas à API. */
  acesso: "lp_acesso",

  /** O token de renovação: só serve para pedir um par novo à API. */
  renovacao: "lp_renovacao",
} as const;
