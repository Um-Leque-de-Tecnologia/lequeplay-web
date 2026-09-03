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

  const alternarTema = () => {
    const novoTema: Tema = tema === "escuro" ? "claro" : "escuro";
    setTema(novoTema);

    if (novoTema === "claro") {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    }
  };

  const iconeExibido = ICONE_PROXIMO_TEMA[tema];
  const rotuloExibido = ROTULO_PROXIMO_TEMA[tema];

  return (
    
    <button
      type="button"
      aria-label={rotuloExibido}
      title={rotuloExibido}
      className="rounded-md p-2 text-zinc-400 transition hover:bg-white/5 hover:text-zinc-100"
    >
      <span aria-hidden="true">{iconeExibido}</span>
    </button>
  );
}
