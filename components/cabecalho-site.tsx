import Link from "next/link";
import { CabecalhoAlternadorTema } from "@/components/cabecalho-alternador-tema";
import { CabecalhoBusca } from "@/components/cabecalho-busca";
import { CabecalhoConta } from "@/components/cabecalho-conta";
import { CabecalhoMenuMobile } from "@/components/cabecalho-menu-mobile";

/**
 * A faixa que abre toda página: marca, navegação, busca e tema.
 *
 * Ela vive num componente próprio, e não solta dentro do `layout.tsx`,
 * porque o layout é o esqueleto do site — quem lê ele quer ver a moldura
 * inteira numa tela, não os detalhes de cada peça.
 */
export function CabecalhoSite() {
  return (
    <header className="border-b border-white/10">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-4">
        <CabecalhoMenuMobile />

        <Link href="/" className="font-semibold">
          🎬 LequePlay
        </Link>

        {/* Some no celular: lá quem navega é o <details> do menu. */}
        <nav aria-label="Principal" className="hidden gap-5 text-sm sm:flex">
          <Link
            href="/midias"
            className="text-zinc-400 transition hover:text-zinc-100"
          >
            Catálogo
          </Link>
        </nav>

        {/* `ml-auto` empurra os controles para a direita sem div extra. */}
        <div className="ml-auto flex items-center gap-1">
          <CabecalhoBusca />
          <CabecalhoAlternadorTema />

          {/*
            Quem entrou, perguntado do navegador. Se este componente lesse a
            sessão no servidor, toda rota do site viraria dinâmica — ver o
            comentário dele e a tabela do build no LP-409.
          */}
          <CabecalhoConta />
        </div>
      </div>
    </header>
  );
}
