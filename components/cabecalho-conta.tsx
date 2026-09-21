"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type Eu = { autenticado: boolean; nome: string | null };

/**
 * O pedaço do cabeçalho que sabe quem entrou.
 *
 * ## Por que ele pergunta do navegador
 *
 * O cabeçalho está no layout raiz. Ler o cookie no servidor aqui tornaria
 * **toda** rota dinâmica — `/` e `/sobre` deixariam de ser pré-geradas. Então
 * o servidor não é consultado na renderização: este componente pergunta a
 * `/api/eu` depois que a página já está na tela.
 *
 * O preço é honesto: por um instante o cabeçalho não sabe. Por isso o espaço
 * é **reservado** desde o primeiro render (o `min-w` abaixo) — sem isso o
 * cabeçalho pula quando a resposta chega, e empurra o que a pessoa ia clicar.
 *
 * ## Por que perguntar de novo a cada navegação
 *
 * O layout raiz **não remonta** entre páginas, e o login termina num
 * `redirect`, não num recarregamento. Sem o `usePathname` na lista de
 * dependências, quem entrasse continuaria vendo "Entrar" no cabeçalho até
 * apertar F5 — e quem saísse continuaria vendo o próprio nome.
 */
export function CabecalhoConta() {
  const caminho = usePathname();
  const [eu, setEu] = useState<Eu | null>(null);

  useEffect(() => {
    // `vivo` evita escrever estado depois que o componente saiu da tela —
    // navegação rápida entre páginas dispara duas buscas, e a primeira pode
    // chegar atrasada.
    let vivo = true;

    fetch("/api/eu", { cache: "no-store" })
      .then((resposta) => (resposta.ok ? resposta.json() : null))
      .then((dados: Eu | null) => {
        if (vivo) setEu(dados ?? { autenticado: false, nome: null });
      })
      .catch(() => {
        // Rede ruim não pode quebrar o cabeçalho: na dúvida, mostra "Entrar".
        if (vivo) setEu({ autenticado: false, nome: null });
      });

    return () => {
      vivo = false;
    };
  }, [caminho]);

  // Enquanto não sabe: o espaço fica guardado, e nada é afirmado.
  if (eu === null) {
    return <span className="min-w-20 px-3 py-2" aria-hidden="true" />;
  }

  if (!eu.autenticado) {
    return (
      <Link
        href={`/entrar?de=${encodeURIComponent(caminho)}`}
        className="min-w-20 rounded-full px-3 py-2 text-center text-sm text-zinc-400 transition hover:text-zinc-100"
      >
        Entrar
      </Link>
    );
  }

  return (
    <Link
      href="/perfil"
      className="min-w-20 truncate rounded-full px-3 py-2 text-center text-sm text-zinc-300 transition hover:text-zinc-100"
    >
      {eu.nome ?? "Minha conta"}
    </Link>
  );
}
