import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FormularioEntrar } from "@/components/formulario-entrar";
import { destinoSeguro } from "@/lib/destino";
import { lerUsuario } from "@/lib/sessao";

export const metadata: Metadata = { title: "Entrar" };

export default async function Entrar({ searchParams }: PageProps<"/entrar">) {
  const { de } = await searchParams;
  const destino = destinoSeguro(de);

  // Quem já está logado não precisa desta tela: segue para onde ia.
  if (await lerUsuario()) {
    redirect(destino);
  }

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Entrar</h1>
      <p className="mt-2 max-w-prose text-sm text-zinc-400">
        A conta é criada por quem administra o LequePlay — não existe cadastro
        aberto. Sem usuário, peça o seu no grupo da turma.
      </p>
      <FormularioEntrar de={destino} />
    </>
  );
}