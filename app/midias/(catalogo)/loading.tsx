import { EsqueletoCatalogo } from "@/components/esqueletos/esqueleto-catalogo";

export default function Loading() {
    return (
        <div
            role="status"
            aria-live="polite"
            aria-busy="true"
            className="motion-safe:animate-pulse"
        >
            {/* Mensagem lida apenas por leitores de tela */}
            <span className="sr-only">Carregando catálogo de filmes, séries e podcasts...</span>

            {/* O componente visual que criamos em components/ */}
            <EsqueletoCatalogo />
        </div>
    );
}