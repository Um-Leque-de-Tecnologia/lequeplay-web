"use client";

import { useActionState } from "react";
import { entrar, type EstadoDoLogin } from "@/app/entrar/acoes";

/**
 * O formulário de login (LP-402).
 *
 * `"use client"` só por causa do `useActionState`: é ele que traz de volta a
 * mensagem de erro e o `pending` do botão. O formulário funciona mesmo antes
 * de o JavaScript carregar — o `<form action>` de uma Server Action é um POST
 * comum.
 */
export function FormularioEntrar({ de }: { de: string }) {
  const [estado, acao, enviando] = useActionState<EstadoDoLogin, FormData>(
    entrar,
    {},
  );

  return (
    <form action={acao} className="mt-8 grid max-w-sm gap-4">
      {/* Para onde voltar. A action confere de novo: campo escondido também é escrito por quem quiser. */}
      <input type="hidden" name="de" value={de} />

      <label className="grid gap-1 text-sm">
        Usuário
        <input
          name="usuario"
          autoComplete="username"
          required
          defaultValue={estado.usuario}
          className="rounded-md border border-white/15 bg-zinc-900 px-3 py-2 text-base"
        />
      </label>

      <label className="grid gap-1 text-sm">
        Senha
        <input
          name="senha"
          type="password"
          autoComplete="current-password"
          required
          className="rounded-md border border-white/15 bg-zinc-900 px-3 py-2 text-base"
        />
      </label>

      {estado.erro && (
        <p role="alert" className="text-sm text-rose-400">
          {estado.erro}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="rounded-md bg-violet-600 px-4 py-2 font-medium text-white transition hover:bg-violet-500 disabled:opacity-60"
      >
        {enviando ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}