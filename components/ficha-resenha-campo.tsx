"use client";

import { useState } from "react";
import { LIMITE_TEXTO_RESENHA } from "@/lib/tipos";

/**
 * O tamanho máximo do texto da resenha.
 *
 * Confirmado em docs/api-contrato.md (PUT /midias/{id}/resenha aceita texto de 10 a 5.000 caracteres)
 * e centralizado em LIMITE_TEXTO_RESENHA em lib/tipos.ts.
 * O limite no cliente serve para orientar a pessoa que digita antes do envio.
 */
export const MAXIMO_DE_CARACTERES = LIMITE_TEXTO_RESENHA.maximo;

/**
 * Margem a partir da qual o leitor de tela começa a anunciar a contagem.
 * Anunciar a cada tecla desde o primeiro caractere sobrecarrega quem usa leitor de tela;
 * anunciar apenas nos últimos 100 caracteres avisa a tempo sem poluir a navegação.
 */
const CARACTERES_AVISO_LEITOR = 100;

export function FichaResenhaCampo() {
  const [escritos, setEscritos] = useState(0);

  const restantes = MAXIMO_DE_CARACTERES - escritos;
  const passouDoLimite = escritos > MAXIMO_DE_CARACTERES;
  const pertoDoLimite = restantes <= CARACTERES_AVISO_LEITOR && restantes >= 0;
  const deveAnunciar = pertoDoLimite || passouDoLimite;

  return (
    <div>
      <textarea
        id="texto"
        name="texto"
        rows={5}
        placeholder="Sem spoiler, por favor."
        aria-invalid={passouDoLimite}
        aria-describedby="contador-resenha"
        onChange={(evento) => setEscritos(evento.target.value.length)}
        className={`mt-2 block w-full max-w-prose rounded-md border bg-zinc-900 px-3 py-2 text-base placeholder:text-zinc-600 focus:outline-none ${
          passouDoLimite
            ? "border-red-500/80 focus:border-red-500 focus:ring-1 focus:ring-red-500"
            : "border-white/15 focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
        }`}
      />

      {/*
        `aria-live="polite"` condicional: só anuncia quando estiver perto ou acima
        do limite. Dessa forma o leitor de tela não interrompe a leitura a cada tecla.
      */}
      <p
        id="contador-resenha"
        role={deveAnunciar ? "status" : undefined}
        aria-live={deveAnunciar ? "polite" : "off"}
        aria-atomic="true"
        className={`mt-1 text-sm ${
          passouDoLimite
            ? "font-medium text-red-400"
            : "text-zinc-500"
        }`}
      >
        {passouDoLimite
          ? `${escritos}/${MAXIMO_DE_CARACTERES} caracteres (${escritos - MAXIMO_DE_CARACTERES} acima do limite)`
          : `${escritos}/${MAXIMO_DE_CARACTERES} caracteres`}
      </p>
    </div>
  );
}
