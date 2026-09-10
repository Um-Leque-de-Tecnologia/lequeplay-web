"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * O mesmo breakpoint do `sm:hidden` lá embaixo — o `sm` do Tailwind é 40rem.
 * A partir dele o menu some da tela, e um menu que some aberto não pode
 * continuar travando a rolagem de uma página onde ele nem aparece.
 */
const LARGURA_DESKTOP = "(min-width: 40rem)";

/**
 * Fecha o menu e, se o foco estava dentro dele, devolve para o botão que
 * abriu. Senão o foco fica num link que acabou de sumir, e o próximo Tab
 * começa de um lugar imprevisível.
 */
function fecharMenu(details: HTMLDetailsElement) {
  const focoEstavaDentro = details.contains(document.activeElement);
  details.open = false;
  if (focoEstavaDentro) details.querySelector("summary")?.focus();
}

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
  // Espelho do `open` do `<details>`, que continua sendo quem manda: a casca
  // só fica sabendo pelo evento `toggle`, e nunca abre nem fecha por ele.
  const [aberto, setAberto] = useState(false);

  // Rede de segurança para navegação que não começa no menu (o voltar do
  // navegador, a busca do cabeçalho). O clique num item fecha pelo `onClick`
  // lá embaixo, e não por aqui: clicar em "Início" estando em "/" navega
  // para o mesmo lugar, o pathname não muda e este efeito não roda.
  useEffect(() => {
    if (detailsRef.current) {
      detailsRef.current.open = false;
    }
  }, [pathname]);

  // Tudo o que só faz sentido com o menu aberto liga aqui e desliga na
  // limpeza — ao fechar ou ao desmontar, o que vier primeiro. Assim nenhuma
  // página fica com listener pendurado à toa, e o `body` nunca fica travado
  // depois que o menu sai de cena.
  useEffect(() => {
    const details = detailsRef.current;
    if (!aberto || !details) return;

    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") fecharMenu(details);
    };

    const desktop = window.matchMedia(LARGURA_DESKTOP);
    const aoMudarLargura = (evento: MediaQueryListEvent) => {
      if (evento.matches) fecharMenu(details);
    };

    window.addEventListener("keydown", aoTeclar);
    desktop.addEventListener("change", aoMudarLargura);
    return () => {
      document.body.style.overflow = overflowAnterior;
      window.removeEventListener("keydown", aoTeclar);
      desktop.removeEventListener("change", aoMudarLargura);
    };
  }, [aberto]);

  return (
    <details
      ref={detailsRef}
      className="relative sm:hidden"
      onToggle={(evento) => setAberto(evento.currentTarget.open)}
      onClick={(evento) => {
        // Um handler só, no lugar de um por item: os links vêm do servidor
        // e não podem receber `onClick`. Então a casca olha de onde veio o
        // clique — um link ou o botão de fechar — e fecha.
        if (
          evento.target instanceof Element &&
          evento.target.closest("a, [data-fecha-menu]")
        ) {
          fecharMenu(evento.currentTarget);
        }
      }}
    >
      {children}
    </details>
  );
}
