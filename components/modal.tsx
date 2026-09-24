"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function Modal({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") router.back();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router]);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={() => router.back()}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-zinc-900 p-6 border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => router.back()}
          className="absolute right-4 top-4 text-zinc-400 hover:text-white"
        >
          ✕ fechar
        </button>
        {children}
      </div>
    </div>
  );
}

export default Modal;