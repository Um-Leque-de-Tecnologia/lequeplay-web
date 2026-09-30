"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

/**
 * A moldura da ficha aberta por cima do catálogo (LP-508, LP-509).
 *
 * `<dialog>` com `showModal()`, e não um `<div role="dialog">`: o navegador
 * deixa o resto da página inerte (o Tab não sai da moldura), transforma o Esc
 * no evento `cancel` e põe o foco no primeiro controle, o "fechar".
 *
 * Fechar é sempre voltar no histórico. A moldura só existe depois de uma
 * navegação suave a partir de `/midias` — no F5 ou no link colado, quem
 * responde é a página inteira —, então sempre há para onde voltar.
 */
export function Modal({ children }: { children: ReactNode }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    // Quem abriu a moldura (o card da grade) recebe o foco de volta no fim:
    // sem isso, o foco cai no <body>, e o próximo Tab leva ao rodapé.
    const origem =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const overflowOriginal = document.body.style.overflow;

    // O fundo não rola enquanto a moldura está aberta.
    document.body.style.overflow = "hidden";
    dialog.showModal();

    return () => {
      dialog.close();
      document.body.style.overflow = overflowOriginal;
      origem?.focus({ preventScroll: true });
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-label="Ficha da mídia"
      onCancel={(evento) => {
        evento.preventDefault();
        router.back();
      }}
      onClick={(evento) => {
        // No fundo escuro, o alvo do clique é o próprio <dialog>.
        if (evento.target === evento.currentTarget) router.back();
      }}
      className="m-auto max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-white/10 bg-zinc-900 p-0 text-zinc-100 backdrop:bg-black/80 backdrop:backdrop-blur-sm"
    >
      <div className="relative p-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="absolute right-4 top-4 text-zinc-400 hover:text-white"
        >
          ✕ fechar
        </button>
        {children}
      </div>
    </dialog>
  );
}
