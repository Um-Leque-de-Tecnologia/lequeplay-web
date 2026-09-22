"use client";

import { useRouter } from "next/navigation";

/** Client porque precisa do `router.back()`. O CONTEÚDO dentro dela
 *  continua Server Component — por isso moldura e conteúdo são separados. */
export function Modal({ children }: { children: React.ReactNode }) {
    const router = useRouter();

    return (
        <div
            className="fixed inset-0 z-50 grid place-items-center bg-black/70"
            onClick={() => router.back()}
        >
            <div
                className="max-w-lg rounded-xl bg-zinc-900 p-6"
                onClick={(e) => e.stopPropagation()}
            >
                {children}
                <button onClick={() => router.back()} className="mt-4 text-violet-400">
                    fechar
                </button>
            </div>
        </div>
    );
}