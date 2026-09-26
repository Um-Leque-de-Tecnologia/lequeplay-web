"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { AcervoFiltravel } from "@/components/acervo-filtravel";
import type { RespostaDoHistorico } from "@/app/api/historico/route";
import type { ItemHistorico, Midia } from "@/lib/tipos";

/**
 * O histórico de quem está vendo a home, buscado **uma vez** no navegador e
 * dividido entre quem precisa dele: a faixa "Continuar assistindo" e o filtro
 * "Só o que eu ainda não vi" do acervo (LP-414).
 *
 * `carregando` é um estado de verdade, e não um histórico vazio: enquanto a
 * resposta não chega, ninguém sabe se a pessoa começou alguma coisa.
 */
type Historico = { estado: "carregando" } | RespostaDoHistorico;

const ContextoDoHistorico = createContext<Historico>({ estado: "carregando" });

export function ProvedorDoHistorico({ children }: { children: ReactNode }) {
  const [historico, setHistorico] = useState<Historico>({ estado: "carregando" });

  useEffect(() => {
    let ativo = true;

    fetch("/api/historico", { cache: "no-store" })
      .then((resposta) => resposta.json() as Promise<RespostaDoHistorico>)
      .catch((): RespostaDoHistorico => ({ estado: "erro" }))
      .then((corpo) => {
        if (ativo) setHistorico(corpo);
      });

    return () => {
      ativo = false;
    };
  }, []);

  return (
    <ContextoDoHistorico.Provider value={historico}>
      {children}
    </ContextoDoHistorico.Provider>
  );
}

export function useHistoricoDaPessoa(): Historico {
  return useContext(ContextoDoHistorico);
}

/** Os itens, quando existem — e lista vazia em todos os outros estados. */
export function itensDoHistorico(historico: Historico): ItemHistorico[] {
  return historico.estado === "pronto" ? historico.itens : [];
}

/**
 * O acervo com o histórico da pessoa, e não mais o de todo mundo.
 *
 * Existe para o `AcervoFiltravel` continuar recebendo `historico` por prop,
 * como antes: quem mexe no filtro dele (LP-502) não precisa saber de onde o
 * histórico vem. Sem sessão, "Só o que eu ainda não vi" mostra tudo — quem
 * não entrou não viu nada.
 */
export function AcervoFiltravelDaPessoa({ itens }: { itens: Midia[] }) {
  const historico = useHistoricoDaPessoa();
  return <AcervoFiltravel itens={itens} historico={itensDoHistorico(historico)} />;
}
