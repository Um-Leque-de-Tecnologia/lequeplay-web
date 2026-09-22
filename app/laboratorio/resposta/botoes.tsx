"use client";

import { curtirSemAvisar } from "./acoes";

export function BotoesDeCurtida() {
    return (
        <button
            onClick={async () => {
                const novo = await curtirSemAvisar();
                console.log("a action devolveu:", novo);   // o valor CHEGA…
            }}
            className="rounded-md bg-zinc-700 px-4 py-2"
        >
            curtir sem avisar
        </button>
    );
}