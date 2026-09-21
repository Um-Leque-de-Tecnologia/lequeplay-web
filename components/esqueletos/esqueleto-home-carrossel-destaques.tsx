import { EsqueletoCard } from "./esqueleto-card-midia";

export function EsqueletoHomeCarrosselDestaques() {
    return (
        <div>
            <section className="mb-14">
                <div className="mb-5 flex items-center justify-between gap-4">
                    <div className="h-6 w-32 rounded bg-zinc-800" />
                    <div className="flex gap-2">
                        <div className="h-7 w-8 rounded-full border border-white/15 bg-zinc-900/60" />
                        <div className="h-7 w-8 rounded-full border border-white/15 bg-zinc-900/60" />
                    </div>
                </div>
                {/* Carrossel de 4 cards */}
                <ul className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <li key={i} className="w-44 shrink-0 snap-start sm:w-52">
                            <figure>
                                <EsqueletoCard />
                                <div className="mt-2 h-3 w-28 rounded bg-violet-400/30" />
                            </figure>
                        </li>
                    ))}
                </ul>
            </section>
        </div>
    )
}
