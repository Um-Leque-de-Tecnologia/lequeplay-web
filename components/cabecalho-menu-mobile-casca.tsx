"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * A parte do menu do celular que precisa de JavaScript — e só ela.
 *
 * O conteúdo (o botão que abre, os links) chega pronto do servidor como
 * `children`. Esta casca é o `<details>` em volta dele, com os
 * comportamentos que o navegador sozinho não tem.
 */
export function CabecalhoMenuMobileCasca({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const detailsRef = useRef<HTMLDetailsElement>(null);

  // Rede de segurança para navegação que não começa no menu (o voltar do
  // navegador, a busca do cabeçalho). O clique num item fecha pelo `onClick`
  // lá embaixo, e não por aqui: clicar em "Início" estando em "/" navega
  // para o mesmo lugar, o pathname não muda e este efeito não roda.
  useEffect(() => {
    if (detailsRef.current) {
      detailsRef.current.open = false;
    }
  }, [pathname]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && detailsRef.current) {
        detailsRef.current.open = false;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <details
      ref={detailsRef}
      className="relative sm:hidden"
      onClick={(evento) => {
        // Um handler só, no lugar de um por item: os links vêm do servidor
        // e não podem receber `onClick`. Então a casca olha de onde veio o
        // clique — um link ou o botão de fechar — e fecha.
        if (
          evento.target instanceof Element &&
          evento.target.closest("a, [data-fecha-menu]")
        ) {
          evento.currentTarget.open = false;
        }
      }}
    >
      {children}
    </details>
  );
}
