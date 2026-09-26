import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FormularioDeEntrar } from "@/app/entrar/formulario";
import { buscarUsuarioLogado } from "@/lib/dal";
import { destinoSeguro } from "@/lib/destino-seguro";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Entre na sua conta do LequePlay.",

  // Tela de conta não tem o que indexar, e um resultado de busca levando ao
  // login é ruído para quem procura um título.
  robots: { index: false, follow: true },
};

type Busca = { de?: string };

export default async function PaginaDeEntrar({
  searchParams,
}: {
  searchParams?: Promise<Busca>;
}) {
  const { de } = (await searchParams) ?? {};

  // Quem já entrou não precisa da tela de entrar (LP-402): vai direto para
  // onde ia — o `?de=`, validado como no login (LP-407), ou a home. A sessão
  // é conferida no `/auth/me`, e não pela existência do cookie: um token
  // vencido cai aqui como "não entrou" e vê o formulário, que é o certo.
  // Fora de `try`: o `redirect` lança, e um `catch` o engoliria.
  if (await buscarUsuarioLogado()) redirect(destinoSeguro(de));

  return (
    <section className="mx-auto max-w-sm py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Entrar</h1>

      <p className="mt-3 text-sm text-zinc-400">
        Entre para acompanhar o que você já viu e escrever sobre os títulos.
      </p>

      <FormularioDeEntrar de={de ?? ""} />

      {/*
        Não existe cadastro na API: `POST /v1/auth/cadastro` responde 404
        (conferido no LP-401). Dizer isso é melhor do que um link "criar
        conta" que leva a lugar nenhum — o caminho de quem ainda não tem conta
        é o LP-416.
      */}
      <p className="mt-8 border-t border-white/10 pt-6 text-sm text-zinc-500">
        Ainda não dá para criar conta por aqui. Fale com quem administra o
        LequePlay para receber um acesso.
      </p>
    </section>
  );
}
