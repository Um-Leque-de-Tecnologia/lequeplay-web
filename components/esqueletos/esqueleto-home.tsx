import { EsqueletoHomeAcervo } from "./esqueleto-home-acervo";
import { EsqueletoHomeCarrosselDestaques } from "./esqueleto-home-carrossel-destaques";
import { EsqueletoHomeContinuarAssistindo } from "./esqueleto-home-continuar-assistindo";

export function EsqueletoHome() {
    return (
        <div aria-hidden="true">
            {/* Hero da Home */}
            <section className="mb-14">
                <div className="h-9 w-3/4 max-w-md rounded-md bg-zinc-800 sm:h-10" />
                <div className="mt-3 h-4 w-full max-w-prose rounded bg-zinc-800/60" />
                <div className="mt-2 h-4 w-4/5 max-w-prose rounded bg-zinc-800/60" />
                <div className="mt-6 h-11 w-36 rounded-full bg-violet-600/40" />
            </section>

            <EsqueletoHomeContinuarAssistindo />

            <EsqueletoHomeCarrosselDestaques />

            <EsqueletoHomeAcervo />

        </div>
    );
}

