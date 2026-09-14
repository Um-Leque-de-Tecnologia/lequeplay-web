"use client";

import { useEffect, useRef, useState } from "react";
/**
 * O botão flutuante que devolve a pessoa ao começo da página.
 *
 * Ele existe porque o catálogo é uma grade longa: quem desce até o fim
 * ficaria rolando de volta no dedo. Fica `fixed` no canto inferior direito,
 * fora do fluxo, para não empurrar o rodapé.
 */
export function RodapeVoltarAoTopo() {
  const [visivel, setVisivel] = useState(false);
  const subindo = useRef(false);

  useEffect(() => {
    const onScroll = () => {
      if (subindo.current) {
        if (window.scrollY < 1) {
          subindo.current = false;
          setVisivel(false);
        }
        return;
      }

      setVisivel(window.scrollY > 400);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      aria-label="Voltar ao topo"
      title="Voltar ao topo"
      hidden={!visivel}
      onClick={(evento) => {
        evento.currentTarget.blur();
        subindo.current = true;

        const reduzir = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;

        window.scrollTo({
          top: 0,
          left: 0,
          behavior: reduzir ? "auto" : "smooth",
        });
      }}
      className="fixed bottom-6 right-6 z-40 rounded-full border border-white/10 bg-zinc-900/90 p-3 text-zinc-300 shadow-lg transition hover:border-violet-500 hover:text-zinc-100 focus-visible:border-violet-500 focus-visible:text-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
    >
      <span aria-hidden="true">↑</span>
    </button>
  );
}
