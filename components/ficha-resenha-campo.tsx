"use client";

import { useState } from "react";
import { LIMITE_TEXTO_RESENHA } from "@/lib/tipos";

/**
 * O tamanho máximo do texto da resenha.
 *
 * Vem de LIMITE_TEXTO_RESENHA, em lib/tipos.ts, que segue o combinado em
 * docs/api-contrato.md: `PUT /midias/{midiaId}/resenha` aceita `texto` entre
 * 10 e 5000 caracteres. O endpoint ainda é 🕓 — é contrato, não API no ar.
 *
 * O campo não tem `maxLength`, de propósito: ele corta em silêncio o que é
 * colado, e quem usa leitor de tela nem fica sabendo que perdeu o fim do
 * texto. Aqui dá para passar do limite, e o contador avisa quanto passou.
 * O limite no cliente orienta quem digita; quem garante é a API.
 */
const MAXIMO_DE_CARACTERES = LIMITE_TEXTO_RESENHA.maximo;

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

  const contagem = passouDoLimite
    ? `${escritos}/${MAXIMO_DE_CARACTERES} caracteres (${escritos - MAXIMO_DE_CARACTERES} acima do limite)`
    : `${escritos}/${MAXIMO_DE_CARACTERES} caracteres`;

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

      <p
        id="contador-resenha"
        className={`mt-1 text-sm ${
          passouDoLimite
            ? "font-medium text-red-400"
            : "text-zinc-500"
        }`}
      >
        {contagem}
      </p>

      {/*
        O anúncio mora numa região viva à parte, que existe desde o primeiro
        render e só ganha texto perto ou acima do limite. Ligar `aria-live` no
        mesmo render em que o texto muda não é confiável: o leitor de tela
        costuma perder justamente o primeiro aviso. Longe do limite ela fica
        vazia, e o leitor não é interrompido a cada tecla.
      */}
      <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {deveAnunciar ? contagem : ""}
      </p>
    </div>
  );
}
