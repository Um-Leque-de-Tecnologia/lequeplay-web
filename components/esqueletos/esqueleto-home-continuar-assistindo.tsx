export function EsqueletoHomeContinuarAssistindo() {

    return (

        <div>
            {/* 2. Continuar Assistindo (HomeContinuarAssistindo) */}
            <section className="mb-14">
                <div className="mb-5 h-6 w-48 rounded bg-zinc-800" />
                <ul className="grid gap-4 sm:grid-cols-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <li
                            key={i}
                            className="flex gap-4 rounded-lg border border-white/10 bg-zinc-900/40 p-3"
                        >
                            {/* Capa do histórico (h-24 w-16) */}
                            <div className="h-24 w-16 shrink-0 rounded-md border border-white/10 bg-zinc-800/60" />

                            <div className="min-w-0 flex-1">
                                {/* Título */}
                                <div className="h-5 w-3/4 rounded bg-zinc-800" />
                                {/* Rótulo do episódio */}
                                <div className="mt-1 h-3.5 w-20 rounded bg-zinc-800/50" />

                                {/* Barra de progresso (progressbar) */}
                                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                                    <div className="h-full w-2/5 rounded-full bg-violet-500/50" />
                                </div>

                                {/* Texto de tracking: "% assistido" */}
                                <div className="mt-1.5 h-3 w-24 rounded bg-zinc-800/50" />

                                {/* Botão "Retomar" */}
                                <div className="mt-3 h-7 w-20 rounded-full border border-white/15 bg-zinc-800/40" />
                            </div>
                        </li>
                    ))}
                </ul>
            </section>
        </div>

    )
}
