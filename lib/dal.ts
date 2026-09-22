import "server-only";

import { cache } from "react";
import { ErroDaApi, buscarUsuarioDaSessao } from "@/lib/api";
import { lerTokenDeAcesso } from "@/lib/sessao";
import type { UsuarioDaSessao } from "@/lib/tipos";

/**
 * A camada que responde "quem está logado?" — e é a única que responde.
 *
 * O nome DAL (*Data Access Layer*) vem do guia de autenticação da versão
 * instalada (`node_modules/next/dist/docs/01-app/02-guides/authentication.md`,
 * seção "Creating a Data Access Layer"). A ideia dele: centralizar num lugar
 * a pergunta sobre a sessão, para que ninguém precise lembrar de fazê-la.
 *
 * ## Ter o cookie não é estar logado
 *
 * `lp_acesso=qualquer-coisa` se escreve no navegador em dois segundos, pelo
 * console. O cookie diz apenas "alguém mandou um texto"; quem sabe se aquele
 * texto vale é a API, em `GET /v1/auth/me`, que responde `401` quando o token
 * é falso, está vencido ou veio malformado — os três são o mesmo caso para
 * quem pergunta. Por isso aqui a conta nunca é feita no front: o token não é
 * aberto, não é decodificado, não é olhado. Ele é **perguntado**.
 */

/**
 * Quem está logado nesta requisição, ou `null`.
 *
 * ## Por que `cache()`
 *
 * O `cache()` do React guarda o resultado **durante uma renderização**. O
 * cabeçalho quer o nome, a página quer o e-mail, e um componente lá embaixo
 * quer os papéis: sem isso, seriam três idas à API para responder à mesma
 * pergunta, na mesma visita. Com ele, é uma.
 *
 * Note o alcance: **uma renderização**, não "cinco minutos". A visita
 * seguinte pergunta de novo — e tem de perguntar mesmo, porque entre uma e
 * outra a sessão pode ter sido encerrada. Isso não é desperdício; é o oposto
 * de guardar resposta de gente em cache compartilhado, que é o erro que o
 * LP-411 mede.
 *
 * ## Por que erro vira `null`, e não exceção
 *
 * Se a API está fora do ar, a resposta honesta para "quem está logado?" é
 * "não sei". Devolver `null` faz o site tratar a visita como deslogada: o
 * catálogo continua de pé, o cabeçalho mostra "Entrar", e a página protegida
 * (LP-405) manda para o login. Falha **fechando** — o caminho errado seria
 * deixar passar na dúvida.
 *
 * O que não acontece é a página inteira cair: um `/me` com problema não pode
 * derrubar a home de quem nem queria entrar na conta.
 */
export const buscarUsuarioLogado = cache(
  async (): Promise<UsuarioDaSessao | null> => {
    const token = await lerTokenDeAcesso();

    // Sem cookie não há o que perguntar: `null` sem gastar uma ida à API.
    if (!token) return null;

    try {
      return await buscarUsuarioDaSessao(token);
    } catch (erro) {
      if (erro instanceof ErroDaApi && (erro.status === 401 || erro.status === 403)) {
        // O caso normal: token vencido, ou inventado. Não é defeito, não vai
        // para o log — senão o log vira ruído toda vez que alguém volta ao
        // site depois de a sessão vencer.
        return null;
      }

      // Aqui sim: 500, tempo esgotado, API fora do ar. Quem estiver de
      // plantão precisa ver isso no log, mesmo que a tela siga funcionando.
      console.error("Não consegui confirmar a sessão com a API", erro);
      return null;
    }
  },
);
