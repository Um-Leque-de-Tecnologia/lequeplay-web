import type { ReactNode } from "react";

type Props = LayoutProps<"/midias"> & {
  modal: ReactNode;
};

export default function LayoutMidias({ children, modal }: Props) {
  return (
    <>
      {children}
      {modal}
    </>
  );
}
