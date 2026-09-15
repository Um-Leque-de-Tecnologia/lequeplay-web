export function EsqueletoCatalogoChipsGenero() {
    // Simula as larguras exatas dos chips de gênero ("Todos", "Ação", "Comédia", etc.)
    const largurasChips = [
        "w-16",
        "w-14",
        "w-20",
        "w-28",
        "w-16",
        "w-32",
        "w-24",
        "w-24",
    ];
    return (
        <div>
            {/* Chips de Gênero (mt-6 flex flex-wrap gap-2) */}
            <div className="mt-6 flex flex-wrap gap-2">
                {largurasChips.map((largura, i) => (
                    <div
                        key={i}
                        className={`h-[34px] ${largura} rounded-full border border-white/15 bg-zinc-800/40`}
                    />
                ))}
            </div>
        </div>

    )
}