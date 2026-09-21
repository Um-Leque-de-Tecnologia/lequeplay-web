export function EsqueletoCard() {
    return (
        <article aria-hidden="true">
            {/* Capa 300x450 (proporção 2:3) */}
            <div className="aspect-[2/3] w-full rounded-lg border border-white/10 bg-zinc-800/60" />

            {/* Título: mt-3 font-medium */}
            <div className="mt-3 h-5 w-4/5 rounded bg-zinc-800" />

            {/* Tipo e ano: mt-1 text-sm */}
            <div className="mt-1 h-4 w-1/2 rounded bg-zinc-800/60" />
        </article>
    );
}
