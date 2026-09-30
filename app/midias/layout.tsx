/**
 * O layout de `/midias` com a fatia `@modal` (LP-508): a ficha aberta a partir
 * do catálogo aparece por cima da grade, sem desmontá-la.
 */
export default function LayoutDasMidias({
  children,
  modal,
}: LayoutProps<"/midias">) {
  return (
    <>
      {children}
      {modal}
    </>
  );
}
