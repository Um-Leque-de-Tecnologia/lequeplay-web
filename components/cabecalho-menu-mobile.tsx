"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const ITENS = [
  { href: "/", rotulo: "Início" },
  { href: "/midias", rotulo: "Catálogo" },
];

export function CabecalhoMenuMobile() {
  const pathname = usePathname();
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    if (detailsRef.current) {
      detailsRef.current.open = false;
    }
  }, [pathname]);

  return (
    <details ref={detailsRef} className="relative sm:hidden">
      <summary
        aria-label="Abrir o menu"
        className="cursor-pointer list-none rounded-md p-2 text-zinc-400 transition hover:bg-white/5 hover:text-zinc-100 [&::-webkit-details-marker]:hidden"
      >
        <span aria-hidden="true">☰</span>
      </summary>

      <nav
        aria-label="Menu do celular"
        className="absolute left-0 top-full z-40 mt-2 w-52 rounded-lg border border-white/10 bg-zinc-900 p-2 shadow-lg"
      >
        <div className="flex justify-end">
          <button
            type="button"
            aria-label="Fechar o menu"
            onClick={() => {
              if (detailsRef.current) detailsRef.current.open = false;
            }}
            className="rounded-md p-1.5 text-zinc-500 transition hover:bg-white/5 hover:text-zinc-100"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>

        <ul className="flex flex-col">
          {ITENS.map((item, indice) => (
            <li key={indice}>
              <Link
                href={item.href}
                className="block rounded-md px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/5 hover:text-zinc-100"
              >
                {item.rotulo}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </details>
  );
}