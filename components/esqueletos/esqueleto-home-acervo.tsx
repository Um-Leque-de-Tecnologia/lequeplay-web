import { EsqueletoCard } from "./esqueleto-card-midia"

export function EsqueletoHomeAcervo() {
    return (
        <div>
            < section >
                <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
                    <div className="h-6 w-24 rounded bg-zinc-800" />
                    <div className="h-4 w-32 rounded bg-zinc-800/50" />
                </div>

                <div className="mb-6 flex items-center gap-2">
                    <div className="size-4 rounded bg-zinc-800" />
                    <div className="h-4 w-44 rounded bg-zinc-800/50" />
                </div>

                <ul className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <li key={i}>
                            <EsqueletoCard />
                        </li>
                    ))}
                </ul>
            </section >

        </div>
    )
}