"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";

type Props = {
  titulo: string;
  children: ReactNode;
};

export function ModalRota({ titulo, children }: Props) {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-zinc-950/80 p-4 sm:p-8">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className="w-full max-w-5xl rounded-xl border border-white/10 bg-zinc-950 p-6 shadow-2xl"
      >
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-4 rounded-md border border-white/15 px-3 py-2 text-sm text-zinc-200 transition hover:border-violet-500 hover:text-violet-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
        >
          Fechar
        </button>

        {children}
      </div>
    </div>
  );
}
