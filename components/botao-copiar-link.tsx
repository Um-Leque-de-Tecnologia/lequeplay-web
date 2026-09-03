"use client";

/**
 * `"use client"` porque isto é evento de usuário + API de navegador
 * (`navigator.clipboard`): nada disso existe no servidor.
 *
 * Copia o endereço da própria aba. O link é lido de `window.location.href`
 * na hora do clique — não vem por prop — para que o botão sirva em qualquer
 * página sem quem o usa ter que montar a URL. Por isso ele é seguro em
 * Server Component: não precisa de `window` na renderização.
 */

import { useState } from "react";

type Estado = "parado" | "copiado" | "erro";

const ROTULO: Record<Estado, string> = {
  parado: "Copiar link",
  copiado: "Link copiado!",
  erro: "Não deu — copie da barra",
};

export function BotaoCopiarLink({ className }: { className?: string }) {
  const [estado, setEstado] = useState<Estado>("parado");

  async function copiar() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setEstado("copiado");
    } catch {
      // Sem HTTPS, sem permissão, ou navegador antigo: o `catch` evita que a
      // promessa rejeitada vire erro não tratado, e a mensagem manda a pessoa
      // para a barra de endereço.
      setEstado("erro");
    }

    // Volta ao texto original depois de um tempo, para o próximo clique.
    window.setTimeout(() => setEstado("parado"), 2000);
  }

  return (
    <button
      type="button"
      onClick={copiar}
      // `aria-live` no próprio botão: quando o texto troca para "Link
      // copiado!", o leitor de tela anuncia sem precisar de região à parte.
      aria-live="polite"
      className={
        className ??
        "rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-500"
      }
    >
      {ROTULO[estado]}
    </button>
  );
}
