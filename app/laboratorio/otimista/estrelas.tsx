"use client";

import { useState } from "react";
import { useOptimistic, useTransition } from "react";
import { salvarNota } from "./acoes";

export function Estrelas({ slug, nota }: { slug: string; nota: number }) {
    // O valor que a tela desenha enquanto o de verdade não volta.
    const [notaOtimista, setNotaOtimista] = useOptimistic(nota);
    const [erro, definirErro] = useState<string | null>(null);
    const [, iniciarTransicao] = useTransition();

    function escolher(nova: number) {
        iniciarTransicao(async () => {
            setNotaOtimista(nova);          // acontece NESTE quadro
            definirErro(null);
            const resultado = await salvarNota(slug, nova);
            if (!resultado.ok) definirErro(resultado.mensagem);
        });
    }

    return (
        <div>
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
            {erro && <p role="alert" className="mt-2 text-sm text-amber-300">{erro}</p>}
        </div>
    );
}