"use client";

import { useOptimistic, useTransition } from "react";
import { salvarNota } from "./acoes";

export function Estrelas({ slug, nota }: { slug: string; nota: number }) {
    // O valor que a tela desenha enquanto o de verdade não volta.
    const [notaOtimista, setNotaOtimista] = useOptimistic(nota);
    const [, iniciarTransicao] = useTransition();

    function escolher(nova: number) {
        iniciarTransicao(async () => {
            setNotaOtimista(nova);          // acontece NESTE quadro
            await salvarNota(slug, nova);   // isto demora — e a tela não espera
        });
    }

    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
                <button
                    key={n}
                    onClick={() => escolher(n)}
                    aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
                    className={n <= notaOtimista ? "text-amber-400" : "text-zinc-600"}
                >
                    ★
                </button>
            ))}
        </div>
    );
}