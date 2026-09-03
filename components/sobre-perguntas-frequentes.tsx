"use client";

import { useState } from "react";

type Pergunta = {
    /** Entra no id do painel, então precisa servir de sufixo de atributo. */
  id: string;
  pergunta: string;
  resposta: string;
};

const PERGUNTAS: Pergunta[] = [
  {
    id: "assistir",
    pergunta: "Dá para assistir aos títulos pelo LequePlay?",
    resposta:
      "Não. O LequePlay é um catálogo: ele te ajuda a decidir o que ver e a lembrar do que já viu. Quem exibe é o serviço onde o título está.",
  },
  {
    id: "acervo",
    pergunta: "De onde vem o acervo?",
    resposta:
      "De uma API própria, que reúne filmes, séries e podcasts no mesmo lugar. O site não guarda catálogo nenhum: ele só mostra o que a API responde.",
  },
  {
    id: "faltando",
    pergunta: "Um título que eu procuro não está aqui. E agora?",
    resposta:
      "O acervo ainda é pequeno e cresce a cada semana. A busca hoje encontra por título; achar pelo que você está a fim de ver é o que estamos construindo.",
  },
  {
    id: "conta",
    pergunta: "Preciso de conta para usar?",
    resposta:
      "Não, e por enquanto nem existe: navegar e olhar não pede login. Diário, resenhas e listas chegam junto com as contas.",
  },
];

/**
 * As perguntas frequentes, em acordeão.
 *
 * Uma resposta por vez na tela: a página do "sobre" é para quem tem uma
 * dúvida específica, e quatro blocos de texto abertos ao mesmo tempo fazem
 * a pessoa procurar a dela no meio do resto.
 *
 * O aria-controls liga cada botão ao painel que ele comanda, e o
 * aria-expanded conta ao leitor de tela se aquele painel está aberto —
 * sem os dois, o acordeão é uma pilha de botões sem relação nenhuma.
 */

export function SobrePerguntasFrequentes() {
  const [abertoId, setAbertoId] = useState<string | null>(null);

  function alternarPergunta(id: string) {
    setAbertoId((atual) => (atual === id ? null : id));
  }

  return (
    <ul className="mt-4 divide-y divide-white/10 border-y border-white/10">
      {PERGUNTAS.map((item) => {
        const estaAberto = abertoId === item.id;

        return (
          <li key={item.id}>
              {/* O <h3> mantém a hierarquia da página; o botão é só o gatilho. */}
            <h3>
              <button
                type="button"
                onClick={() => alternarPergunta(item.id)}
                aria-expanded={estaAberto}
                aria-controls={`resposta-${item.id}`}
                className="flex w-full items-center justify-between gap-4 py-4 text-left font-medium transition hover:text-violet-300"
              >
                {item.pergunta}
                {/* O ícone roda 45 graus suavemente, virando um "x" */}
                <span
                  aria-hidden="true"
                  className={`inline-block text-zinc-500 transition-transform duration-300 ${
                    estaAberto ? "rotate-45 text-violet-400" : ""
                  }`}
                >
                  +
                </span>
              </button>
            </h3>

            {/* O container animado com Grid */}
            <div
              id={`resposta-${item.id}`}
              className={`grid transition-all duration-300 ease-in-out ${
                estaAberto
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0"
              }`}
            >
              {/* O elemento com overflow-hidden para não vazar texto durante a descida/subida */}
              <div className="overflow-hidden">
                <div className="max-w-prose pb-4 text-sm text-zinc-400">
                  {item.resposta}
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}