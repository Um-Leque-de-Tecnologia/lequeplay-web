"use client";

import { useState } from "react";

type Tema = "claro" | "escuro";

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
    document.documentElement.setAttribute("data-tema", novoTema);
  };

  const iconeExibido = ICONE_PROXIMO_TEMA[tema];
  const rotuloExibido = ROTULO_PROXIMO_TEMA[tema];

  return (
    <button
      type="button"
      onClick={alternarTema}
      aria-label={rotuloExibido}
      title={rotuloExibido}
      className="rounded-md p-2 text-zinc-400 transition hover:bg-white/5 hover:text-zinc-100"
    >
      <span aria-hidden="true">{iconeExibido}</span>
    </button>
  );
}
