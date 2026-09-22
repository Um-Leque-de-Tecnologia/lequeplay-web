"use server";

import { redirect } from "next/navigation";
import { sairDaConta } from "@/lib/api";
import { apagarSessao, lerTokenDeRenovacao } from "@/lib/sessao";

/**
 * Encerra a sessão.
 *
 * ## Por que é POST, e não um link
 *
 * Um link `GET /sair` é disparável de fora: basta um `<img src=".../sair">`
 * num fórum para deslogar quem passar por lá. Server Action é sempre `POST`
 * na própria rota, e o Next ainda compara o `Origin` com o `Host` — POST de
 * outro site é recusado antes de a função rodar.
 *
 * ## Duas coisas têm de acontecer, e elas são independentes
 *
 * 1. **Avisar a API** (`POST /v1/auth/logout`), que mata o token de
 *    renovação no Keycloak. Sem isso, o cookie some do navegador e a sessão
 *    continua viva do lado de lá.
 * 2. **Apagar os cookies daqui.**
 *
 * A segunda acontece **mesmo que a primeira falhe**. Se a API estiver fora do
 * ar, quem clicou em "Sair" precisa sair assim mesmo — deixar a pessoa presa
 * numa sessão porque um servidor não respondeu é o pior dos dois mundos, e é
 * o que o card pede que não aconteça.
 *
 * ## O que o logout não faz
 *
 * O `logout` mata o token de **renovação**. O de acesso é um JWT: ele
 * continua válido até vencer, e nenhum pedido à API o invalida. É por isso
 * que ele vive minutos, e não horas — o `maxAge` do cookie vem do
 * `expiresIn` (LP-403). Prometer "acesso revogado agora" seria mentira.
 */
export async function sair() {
  const tokenDeRenovacao = await lerTokenDeRenovacao();

  if (tokenDeRenovacao) {
    try {
      await sairDaConta(tokenDeRenovacao);
    } catch (erro) {
      // Não interrompe: a pessoa sai daqui de qualquer jeito. Fica no log
      // porque uma sessão que sobreviveu no Keycloak é problema de quem opera.
      console.error("Não consegui avisar a API sobre o logout", erro);
    }
  }

  await apagarSessao();

  // Fora de qualquer try/catch: `redirect` funciona lançando uma exceção de
  // controle, e um `catch` por perto a engoliria.
  redirect("/");
}
