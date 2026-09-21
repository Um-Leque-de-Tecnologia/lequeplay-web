import { EsqueletoCard } from "./esqueleto-card-midia";
import { EsqueletoCatalogoChipsGenero } from "./esqueleto-catalogo-chips-genero";
import { EsqueletoCatalogoOrdenacao } from "./esqueleto-catalogo-ordenacao";

export function EsqueletoCatalogo() {


    return (

        <div>
            <div aria-hidden="true">
                {/* Título "Catálogo" */}
                <div className="h-8 w-36 rounded-md bg-zinc-800 sm:h-9" />

                {/* Formulário de Busca (mt-6 flex flex-wrap gap-2) */}
                <div className="mt-6 flex flex-wrap gap-2">
                    <div className="h-[42px] min-w-64 flex-1 rounded-md border border-white/15 bg-zinc-900/60" />
                    <div className="h-[42px] w-20 rounded-md bg-violet-600/40" />
                </div>


                <EsqueletoCatalogoChipsGenero />

                <EsqueletoCatalogoOrdenacao />


                {/* Grade de cartões idêntica ao catálogo (mt-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4) */}
                <ul className="mt-4 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <li key={i}>
                            <EsqueletoCard />
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
