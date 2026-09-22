"use client";

import { useActionState } from "react";
import { avaliar, type EstadoNota } from "./acoes";

const INICIAL: EstadoNota = {};

export default function PaginaDaAcao() {
    const [estado, enviar, enviando] = useActionState(avaliar, INICIAL);

    return (
        <main className="space-y-4 p-8">
            <h1 className="text-2xl font-semibold">A função que é um POST</h1>

            <form action={enviar} className="space-y-3">
                <label htmlFor="nota" className="block text-sm text-zinc-300">
                    Sua nota (1 a 5)
                </label>
                <input
                    id="nota"
                    name="nota"
                    type="number"
                    min={1}
                    max={5}
                    required
                    className="w-24 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2"
                />
                <button
                    type="submit"
                    disabled={enviando}
                    className="rounded-md bg-violet-600 px-4 py-2 font-medium text-white disabled:opacity-50"
                >
                    {enviando ? "Enviando…" : "Avaliar"}
                </button>

                {estado.erro && (
                    <p role="alert" className="text-amber-300">{estado.erro}</p>
                )}
                {estado.nota && (
                    <p className="text-emerald-300">{`A action devolveu: ${estado.nota}`}</p>
                )}
            </form>
        </main>
    );
}