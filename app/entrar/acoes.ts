"use server";

import { redirect } from "next/navigation";
import { ErroDaApi, entrarNaConta } from "@/lib/api";
import { destinoSeguro } from "@/lib/destino-seguro";
import { gravarSessao } from "@/lib/sessao";

/**
 * O que a tela de entrar sabe depois de uma tentativa.
 *
 * A senha **não** está aqui, e isso é deliberado: o estado volta para o
 * navegador, e devolver a senha digitada significaria mandá-la de volta pela
 * rede sem necessidade nenhuma. O usuário volta, para a pessoa não redigitar.
 */
export type EstadoDoLogin = {
  erro?: string;
  usuario?: string;
};

/**
 * Troca usuário e senha por uma sessão em cookie.
 *
 * É uma Server Action, e por isso é também **um endpoint**: qualquer pessoa
 * manda um POST para ela, com qualquer corpo, sem passar pela tela. Por isso
 * tudo o que chega no `FormData` é tratado como texto de estranho — o que o
 * LP-415 desenvolve.
 */
export async function entrar(
  _estadoAnterior: EstadoDoLogin,
  dados: FormData,
): Promise<EstadoDoLogin> {
  const usuario = String(dados.get("usuario") ?? "").trim();
  const senha = String(dados.get("senha") ?? "");

  // O destino passa pelo filtro antes de qualquer coisa. Ele chega de um
  // campo escondido, que é escrito por quem quiser — ver `lib/destino-seguro`.
  const destino = destinoSeguro(String(dados.get("de") ?? ""));

  if (!usuario || !senha) {
    return { erro: "Preencha usuário e senha.", usuario };
  }

  try {
    const tokens = await entrarNaConta({ usuario, senha });
    await gravarSessao(tokens);
  } catch (erro) {
    if (erro instanceof ErroDaApi && erro.status === 401) {
      // Uma mensagem só para usuário inexistente e senha errada. A API também
      // não distingue os dois — e distinguir entregaria quais usuários
      // existem na base, um de cada vez, para quem tiver paciência.
      return { erro: "Usuário ou senha inválidos.", usuario };
    }

    // O contrato publicado prevê `429` no login (MuitasTentativas). Sem este
    // caso, quem errou a senha várias vezes lia "não conseguimos falar com o
    // servidor" — e tentava de novo, que é justamente o que não deve fazer.
    if (erro instanceof ErroDaApi && erro.status === 429) {
      return {
        erro: "Muitas tentativas seguidas. Espere alguns minutos e tente de novo.",
        usuario,
      };
    }

    // Tempo esgotado, API fora do ar, 500: outra mensagem, porque a pessoa
    // não errou nada e tentar de novo em dez segundos pode resolver. O
    // `detail` da API (em inglês, com mensagem interna do Keycloak) nunca
    // chega aqui: o `lib/api.ts` só deixa passar o status.
    return {
      erro: "Não conseguimos falar com o servidor agora. Tente de novo em instantes.",
      usuario,
    };
  }

  // FORA do try/catch, de propósito: `redirect` funciona lançando uma exceção
  // de controle. Dentro do `try`, o `catch` a engoliria e o login "entraria
  // sem sair da tela" — o bug que o card avisa.
  redirect(destino);
}
