"use client";

import { usePathname } from "next/navigation";

/**
 * Cartão esqueleto com proporções e margens milimétricas
 * idênticas ao <CardMidia /> (aspecto 2:3, bordas e espaçamentos).
 */
function EsqueletoCard() {
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

/**
 * 1. Esqueleto do CATÁLOGO (/midias)
 * Espelho fiel de app/midias/page.tsx:
 * - Título "Catálogo" (text-2xl sm:text-3xl)
 * - Barra de busca (input min-w-64 flex-1 + botão roxo)
 * - Pílulas de gêneros (CatalogoChipsGenero) com larguras realistas
 * - Barra de contagem e ordenação (CatalogoOrdenacao)
 * - Grade de 8 cartões (grid-cols-2 sm:grid-cols-3 lg:grid-cols-4)
 */
function EsqueletoCatalogo() {
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
        <div aria-hidden="true">
            {/* Título "Catálogo" */}
            <div className="h-8 w-36 rounded-md bg-zinc-800 sm:h-9" />

            {/* Formulário de Busca (mt-6 flex flex-wrap gap-2) */}
            <div className="mt-6 flex flex-wrap gap-2">
                <div className="h-[42px] min-w-64 flex-1 rounded-md border border-white/15 bg-zinc-900/60" />
                <div className="h-[42px] w-20 rounded-md bg-violet-600/40" />
            </div>

            {/* Chips de Gênero (mt-6 flex flex-wrap gap-2) */}
            <div className="mt-6 flex flex-wrap gap-2">
                {largurasChips.map((largura, i) => (
                    <div
                        key={i}
                        className={`h-[34px] ${largura} rounded-full border border-white/15 bg-zinc-800/40`}
                    />
                ))}
            </div>

            {/* Linha de contagem e botão de ordenação (mt-6 flex justify-between) */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <div className="h-4 w-24 rounded bg-zinc-800/60" />
                <div className="h-[38px] w-48 rounded-md border border-white/15 bg-zinc-900/60" />
            </div>

            {/* Grade de cartões idêntica ao catálogo (mt-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4) */}
            <ul className="mt-4 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                    <li key={i}>
                        <EsqueletoCard />
                    </li>
                ))}
            </ul>
        </div>
    );
}

/** 2. Esqueleto da página SOBRE (/sobre) */
function EsqueletoSobre() {
    return (
        <article aria-hidden="true">
            {/* Título "Sobre o LequePlay" */}
            <div className="h-8 w-64 rounded bg-zinc-800 sm:h-9" />

            {/* Parágrafos */}
            <div className="mt-5 space-y-2 max-w-prose">
                <div className="h-4 w-full rounded bg-zinc-800/60" />
                <div className="h-4 w-11/12 rounded bg-zinc-800/60" />
                <div className="h-4 w-4/5 rounded bg-zinc-800/60" />
            </div>

            <div className="mt-5 space-y-2 max-w-prose">
                <div className="h-4 w-full rounded bg-zinc-800/60" />
                <div className="h-4 w-5/6 rounded bg-zinc-800/60" />
            </div>

            {/* Seção "O que ainda vem" */}
            <div className="mt-12">
                <div className="h-6 w-44 rounded bg-zinc-800" />
                <div className="mt-3 space-y-2 max-w-prose">
                    <div className="h-4 w-full rounded bg-zinc-800/60" />
                    <div className="h-4 w-3/4 rounded bg-zinc-800/60" />
                </div>
            </div>

            {/* Acordeão de perguntas frequentes */}
            <div className="mt-12">
                <div className="h-6 w-52 rounded bg-zinc-800" />
                <div className="mt-4 divide-y divide-white/10 border-y border-white/10">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex items-center justify-between py-4">
                            <div className="h-5 w-3/5 rounded bg-zinc-800/70" />
                            <div className="h-4 w-4 rounded bg-zinc-800/40" />
                        </div>
                    ))}
                </div>
            </div>
        </article>
    );
}

/** 3. Esqueleto da FICHA TÉCNICA (/midias/[slug]) */
function EsqueletoFicha() {
    return (
        <article aria-hidden="true">
            {/* Trilha "← Voltar ao catálogo" */}
            <div className="mb-6 h-4 w-36 rounded bg-zinc-800/60" />

            {/* Grid com capa à esquerda e detalhes à direita */}
            <div className="grid gap-8 sm:grid-cols-[240px_1fr]">
                <div className="aspect-[2/3] w-full rounded-lg border border-white/10 bg-zinc-800/60" />

                <div>
                    {/* Título da mídia */}
                    <div className="h-8 w-3/4 max-w-sm rounded bg-zinc-800 sm:h-9" />

                    {/* Avaliação (estrelas + total de votos) */}
                    <div className="mt-2 h-4 w-44 rounded bg-zinc-800/60" />

                    {/* Sinopse resumida no topo (FichaSinopse) */}
                    <div className="mt-5 space-y-2 max-w-prose">
                        <div className="h-4 w-full rounded bg-zinc-800/50" />
                        <div className="h-4 w-full rounded bg-zinc-800/50" />
                        <div className="h-4 w-3/4 rounded bg-zinc-800/50" />
                        <div className="mt-2 h-4 w-16 rounded bg-violet-400/40" />
                    </div>
                </div>
            </div>

            {/* Abas da ficha: Sinopse / Elenco / Detalhes técnicos (FichaAbas) */}
            <section className="mt-12">
                <div className="flex flex-wrap gap-1 border-b border-white/10">
                    <div className="-mb-px h-9 w-24 border-b-2 border-violet-500 bg-zinc-800/40" />
                    <div className="h-9 w-20 bg-zinc-800/20" />
                    <div className="h-9 w-36 bg-zinc-800/20" />
                </div>
                <div className="pt-6 space-y-2 max-w-prose">
                    <div className="h-4 w-full rounded bg-zinc-800/40" />
                    <div className="h-4 w-5/6 rounded bg-zinc-800/40" />
                </div>
            </section>

            {/* Seção de Episódios / Temporadas (FichaTemporadas) */}
            <section className="mt-12">
                <div className="mb-4 flex flex-wrap items-center gap-4">
                    <div className="h-6 w-28 rounded bg-zinc-800" />
                    <div className="h-[34px] w-40 rounded-md border border-white/15 bg-zinc-900/60" />
                </div>
                <ol className="divide-y divide-white/10 border-y border-white/10">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <li key={i} className="flex flex-wrap items-baseline gap-x-3 py-3">
                            <div className="h-4 w-4 rounded bg-zinc-800/60" />
                            <div className="h-4 w-1/3 rounded bg-zinc-800/70" />
                            <div className="ml-auto h-4 w-12 rounded bg-zinc-800/50" />
                        </li>
                    ))}
                </ol>
            </section>

            {/* Formulário de Resenha (FichaResenha) */}
            <section className="mt-12">
                <div className="mb-3 h-6 w-32 rounded bg-zinc-800" />
                <div className="h-4 w-52 rounded bg-zinc-800/60" />
                <div className="mt-2 h-28 w-full max-w-prose rounded-md border border-white/15 bg-zinc-900/60" />
                <div className="mt-1 h-3.5 w-28 rounded bg-zinc-800/50" />
                <div className="mt-3 h-9 w-36 rounded-md bg-zinc-800/60" />
            </section>

            {/* Compartilhar link (FichaCompartilhar) */}
            <section className="mt-12">
                <div className="mb-3 h-6 w-36 rounded bg-zinc-800" />
                <div className="flex flex-wrap items-center gap-2">
                    <div className="h-9 min-w-72 flex-1 rounded-md border border-white/15 bg-zinc-900/60" />
                    <div className="h-9 w-28 rounded-md bg-violet-600/40" />
                </div>
            </section>
        </article>
    );
}

/** 4. Esqueleto da HOME ("/") */
function EsqueletoHome() {
    return (
        <div aria-hidden="true">
            {/* 1. Hero da Home */}
            <section className="mb-14">
                <div className="h-9 w-3/4 max-w-md rounded-md bg-zinc-800 sm:h-10" />
                <div className="mt-3 h-4 w-full max-w-prose rounded bg-zinc-800/60" />
                <div className="mt-2 h-4 w-4/5 max-w-prose rounded bg-zinc-800/60" />
                <div className="mt-6 h-11 w-36 rounded-full bg-violet-600/40" />
            </section>

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

            {/* 3. Em Destaque (HomeCarrosselDestaques) */}
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

            {/* 4. O Acervo (HomeAcervo) */}
            <section>
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
            </section>
        </div>
    );
}

export default function Loading() {
    const pathname = usePathname();

    function renderizarEsqueleto() {
        if (pathname === "/sobre") {
            return <EsqueletoSobre />;
        }

        if (pathname.startsWith("/midias/") && pathname !== "/midias") {
            return <EsqueletoFicha />;
        }

        if (pathname === "/midias") {
            return <EsqueletoCatalogo />;
        }

        return <EsqueletoHome />;
    }

    return (
        <div
            role="status"
            aria-live="polite"
            aria-busy="true"
            className="motion-safe:animate-pulse"
        >
            <span className="sr-only">Carregando conteúdo do LequePlay...</span>
            {renderizarEsqueleto()}
        </div>
    );
}