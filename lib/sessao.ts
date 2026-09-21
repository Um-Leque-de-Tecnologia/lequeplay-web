import "server-only";

import { cookies } from "next/headers";
import type { TokensDaSessao } from "@/lib/tipos";

/**
 * Onde a sessão mora: dois cookies `httpOnly`.
 *
 * ## Por que cookie, e não `localStorage`
 *
 * Onde o token fica decide o tamanho do estrago de um XSS. No
 * `localStorage`, qualquer script que rode na página lê e leva embora — e
 * "qualquer script" inclui a dependência que alguém adicionou ontem. Num
 * cookie `httpOnly`, o JavaScript da página **não enxerga**: o navegador
 * manda o cookie sozinho, e o valor nunca passa pelo código do front.
 *
 * ## Por que este módulo importa `server-only`
 *
 * Ele lê e escreve credencial. Se um componente de cliente importá-lo por
 * engano — um import automático do editor resolve isso em meio segundo —, o
 * **build quebra**, em vez de o segredo viajar para o navegador junto com o
 * pacote. É uma barreira que falha cedo e alto.
 */

/** O token de acesso: é ele que vai no `Authorization` das chamadas à API. */
const COOKIE_ACESSO = "lp_acesso";

/** O token de renovação: só serve para pedir um par novo à API. */
const COOKIE_RENOVACAO = "lp_renovacao";

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
 * As opções que valem para os dois cookies.
 *
 * **`sameSite: "lax"`, e não `"strict"`.** Com `strict`, o cookie não
 * acompanha nenhuma navegação vinda de fora do site: quem clicasse num link
 * do LequePlay compartilhado no WhatsApp chegaria **deslogado**, e o site
 * mostraria "Entrar" para quem acabou de entrar. `lax` manda o cookie em
 * navegação de topo (clicar num link), e não manda em requisição de terceiro
 * — que é a proteção que interessa contra CSRF.
 */
const OPCOES_BASE = {
  httpOnly: true,
  secure: EM_PRODUCAO,
  sameSite: "lax",
  path: "/",
} as const;

/**
 * Grava o par de tokens.
 *
 * Só funciona em Server Action ou Route Handler: num Server Component o Next
 * lança `Cookies can only be modified in a Server Action or Route Handler`.
 * Não é capricho do framework — o cabeçalho `Set-Cookie` precisa sair antes
 * do corpo, e durante a renderização o corpo já começou.
 *
 * O `maxAge` de cada cookie é a validade que a própria API informou
 * (`expiresIn` e `refreshExpiresIn`, em segundos). Assim o cookie **some
 * sozinho** quando o token vence, em vez de o site tentar usar um token
 * morto e descobrir pelo 401.
 */
export async function gravarSessao(tokens: TokensDaSessao): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_ACESSO, tokens.accessToken, {
    ...OPCOES_BASE,
    maxAge: tokens.expiresIn,
  });

  cookieStore.set(COOKIE_RENOVACAO, tokens.refreshToken, {
    ...OPCOES_BASE,
    maxAge: tokens.refreshExpiresIn,
  });
}

/** O token de acesso, ou `undefined` se ele venceu ou nunca existiu. */
export async function lerTokenDeAcesso(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_ACESSO)?.value;
}

/** O token de renovação, que sobrevive ao de acesso e serve para renová-lo. */
export async function lerTokenDeRenovacao(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_RENOVACAO)?.value;
}

/**
 * Apaga os dois cookies.
 *
 * Usado ao sair (LP-408) e quando a renovação é recusada (LP-410) — nesse
 * caso, deixar o cookie de renovação para trás faria todo pedido seguinte
 * tentar renovar de novo, e falhar de novo.
 */
export async function apagarSessao(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_ACESSO);
  cookieStore.delete(COOKIE_RENOVACAO);
}

/** Os nomes, exportados para o proxy — que lê cookie sem passar por aqui. */
export const NOMES_DOS_COOKIES = {
  acesso: COOKIE_ACESSO,
  renovacao: COOKIE_RENOVACAO,
} as const;
