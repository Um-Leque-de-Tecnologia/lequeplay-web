"use client";

import { useState } from "react";

type Tema = "claro" | "escuro";

/**
 * Hoje o site nasce escuro — o `globals.css` já responde a
 * `prefers-color-scheme`, e o `body` fixa o fundo em zinc-950. Enquanto a
 * escolha da pessoa não é guardada em lugar nenhum, o tema de partida é uma
 * constante, não um estado.
 */
const TEMA_ATUAL: Tema = "escuro";

const ICONE_PROXIMO_TEMA: Record<Tema, string> = {
  escuro: "☀️",
  claro: "🌙",
};

const ROTULO_PROXIMO_TEMA: Record<Tema, string> = {
  claro: "Usar o tema escuro",
  escuro: "Usar o tema claro",
};

/** O botão que troca entre claro e escuro. */
export function CabecalhoAlternadorTema() {
  const [tema, setTema] = useState<Tema>("escuro");
  return (
    <button
      type="button"
      aria-label={ROTULO[TEMA_ATUAL]}
      title={ROTULO[TEMA_ATUAL]}
      className="rounded-md p-2 text-zinc-400 transition hover:bg-white/5 hover:text-zinc-100"
    >
      <span aria-hidden="true">{ICONE[TEMA_ATUAL]}</span>
    </button>
  );
}
