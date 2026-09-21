"use client";

import { useActionState } from "react";
import { entrar, type EstadoDoLogin } from "@/app/entrar/acoes";

const ESTADO_INICIAL: EstadoDoLogin = {};

/**
 * O formulário de entrar.
 *
 * É `<form action={...}>` com Server Action: **funciona sem JavaScript**. Sem
 * o JS carregado, o navegador manda um POST comum e a action roda igual —
 * quem usa conexão ruim ou tem o script bloqueado consegue entrar.
 *
 * O `useActionState` acrescenta o que só existe com JS: a mensagem de erro
 * sem recarregar, o botão que sabe que está enviando, e o usuário digitado de
 * volta no campo. Ele é acréscimo, não substituto.
 */
export function FormularioDeEntrar({ de }: { de: string }) {
  const [estado, acao, enviando] = useActionState(entrar, ESTADO_INICIAL);

  return (
    <form action={acao} className="mt-8 flex flex-col gap-4">
      {/*
        O destino viaja num campo escondido porque a action não enxerga a
        query da página. Campo escondido é escrito por quem quiser — por isso
        quem valida o destino é o servidor, dentro da action (LP-407).
      */}
      <input type="hidden" name="de" value={de} />

      {estado.erro && (
        /*
          `role="alert"` para o leitor de tela anunciar o erro assim que ele
          aparece: sem isso, quem não enxerga a tela continua esperando uma
          resposta que já chegou.
        */
        <p
          role="alert"
          className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200"
        >
          {estado.erro}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="usuario" className="text-sm text-zinc-400">
          Usuário
        </label>
        <input
          id="usuario"
          name="usuario"
          type="text"
          autoComplete="username"
          required
          // O que a pessoa digitou volta depois do erro. A senha não volta.
          defaultValue={estado.usuario}
          className="rounded-md border border-white/15 bg-zinc-900 px-3 py-2 text-base focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="senha" className="text-sm text-zinc-400">
          Senha
        </label>
        <input
          id="senha"
          name="senha"
          type="password"
          autoComplete="current-password"
          required
          className="rounded-md border border-white/15 bg-zinc-900 px-3 py-2 text-base focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
        />
      </div>

      <button
        type="submit"
        disabled={enviando}
        className="mt-2 rounded-full bg-violet-600 px-5 py-2.5 font-medium text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {enviando ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
