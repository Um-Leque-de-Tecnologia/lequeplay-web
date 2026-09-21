import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { buscarUsuarioLogado } from "@/lib/dal";

export const metadata: Metadata = {
  title: "Seu perfil",
  description: "Os dados da sua conta no LequePlay.",

  // Página de uma pessoa só. Não há o que indexar, e um resultado de busca
  // apontando para cá é ruído — quem chegar vai parar no login.
  robots: { index: false, follow: false },
};

/**
 * A primeira tela da conta: mostra quem entrou, e só abre para quem entrou.
 *
 * ## Quem protege esta página é esta página
 *
 * O proxy (LP-406) vai adiantar o caminho — ele roda antes e devolve 307 sem
 * nem montar a tela. Mas ele olha só se o **cookie existe**, e cookie qualquer
 * um escreve. Quem decide se a pessoa vê o dado é quem busca o dado: a
 * chamada abaixo pergunta à API se aquele token vale.
 *
 * O teste que prova isso: apagar o `proxy.ts` não pode abrir nada. Se abrir, a
 * proteção estava no lugar errado o tempo todo.
 *
 * ## Só o que o `/me` devolve
 *
 * Nome, e-mail e papéis saem da resposta da API. Nada é inventado, nada é
 * deduzido do token. Se a API não mandou o e-mail, a tela diz que não tem —
 * em vez de mostrar um traço que a pessoa lê como "está vazio no cadastro".
 */
export default async function PaginaDePerfil() {
  const usuario = await buscarUsuarioLogado();

  if (!usuario) {
    // O `de` leva a pessoa de volta para cá depois de entrar. Quem valida
    // esse destino é a action do login (LP-407) — aqui ele é escrito por nós,
    // mas lá ele chega como texto de estranho.
    redirect("/entrar?de=/perfil");
  }

  const papeis = usuario.roles ?? [];

  return (
    <section className="mx-auto max-w-xl py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Seu perfil</h1>

      <dl className="mt-8 flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <dt className="text-sm text-zinc-400">Usuário</dt>
          <dd className="text-base">{usuario.username ?? "não informado"}</dd>
        </div>

        <div className="flex flex-col gap-1">
          <dt className="text-sm text-zinc-400">E-mail</dt>
          <dd className="text-base">{usuario.email ?? "não informado"}</dd>
        </div>

        <div className="flex flex-col gap-1">
          <dt className="text-sm text-zinc-400">Papéis</dt>
          <dd className="text-base">
            {papeis.length > 0 ? papeis.join(", ") : "nenhum"}
          </dd>
        </div>
      </dl>

      <p className="mt-10 border-t border-white/10 pt-6 text-sm text-zinc-500">
        Ainda não dá para alterar esses dados por aqui — eles vêm do sistema de
        contas, e a API só os mostra.
      </p>
    </section>
  );
}
