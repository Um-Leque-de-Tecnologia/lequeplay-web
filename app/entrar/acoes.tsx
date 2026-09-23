"use server";

import { redirect } from "next/navigation";
import { entrarNaApi, sairDaApi } from "@/lib/api";
import { destinoSeguro } from "@/lib/destino";
import { apagarSessao, gravarSessao, lerRenovacao } from "@/lib/sessao";

/**
 * O que a tela de login precisa saber depois de uma tentativa que falhou.
 *
 * Volta o `usuario` para o campo não ficar vazio. A senha nunca volta.
 */
export type EstadoDoLogin = {
  erro?: string;
  usuario?: string;
};

export async function entrar(
  _anterior: EstadoDoLogin,
  dados: FormData,
): Promise<EstadoDoLogin> {
  const usuario = String(dados.get("usuario") ?? "").trim();
  const senha = String(dados.get("senha") ?? "");

  if (!usuario || !senha) {
    return { erro: "Preencha usuário e senha.", usuario };
  }

  const resultado = await entrarNaApi(usuario, senha);

  if (!resultado.ok) {
    return {
      // Uma frase só para usuário inexistente e senha errada: dizer qual dos
      // dois falhou entrega quais usuários existem.
      erro:
        resultado.motivo === "credencial"
          ? "Usuário ou senha incorretos."
          : "Não conseguimos falar com o serviço de login agora. Tente de novo em instantes.",
      usuario,
    };
  }

  await gravarSessao(resultado.tokens);

  // Fora de try/catch: o `redirect` funciona lançando um erro de propósito,
  // e um catch em volta o engoliria.
  redirect(destinoSeguro(dados.get("de")));
}

/**
 * Sai (LP-408). Só por POST — é uma Server Action num `<form>`.
 *
 * Sair por GET (`<a href="/sair">`) seria disparável de fora: basta um
 * `<img src="https://lequeplay/sair">` num fórum para deslogar quem passar.
 */
export async function sair() {
  const renovacao = await lerRenovacao();

  // Avisar a API é melhor esforço: se ela falhar, o cookie sai do mesmo jeito.
  if (renovacao) await sairDaApi(renovacao);

  await apagarSessao();
  redirect("/");
}