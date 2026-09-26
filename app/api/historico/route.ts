import { NextResponse } from "next/server";
import { listarHistorico } from "@/lib/api";
import { buscarUsuarioLogado } from "@/lib/dal";
import { lerTokenDeAcesso } from "@/lib/sessao";
import type { ItemHistorico } from "@/lib/tipos";

/**
 * O histórico de quem está no navegador, para a home pedir de lá (LP-414).
 *
 * Mesmo desenho do `/api/eu`, pelo mesmo motivo: se a home lesse o cookie no
 * servidor, ela deixaria de ser pré-gerada — e o catálogo inteiro seria
 * renderizado de novo a cada visita por causa de uma faixa. A página continua
 * estática; o que é de uma pessoa chega depois, pedido pelo navegador dela.
 *
 * `private, no-store` em toda resposta: é dado de uma pessoa, e cache
 * compartilhado serviria o histórico de alguém para outra pessoa.
 */
export type RespostaDoHistorico =
  | { estado: "anonimo" }
  | { estado: "indisponivel" }
  | { estado: "erro" }
  | { estado: "pronto"; itens: ItemHistorico[] };

const PRIVADO = { "Cache-Control": "private, no-store" };

function responder(corpo: RespostaDoHistorico, status = 200) {
  return NextResponse.json(corpo, { status, headers: PRIVADO });
}

export async function GET() {
  // Ter o cookie não prova nada: quem diz se o token vale é o `/auth/me`.
  // Sem isso, um cookie inventado ganharia o histórico do mock.
  const usuario = await buscarUsuarioLogado();
  const token = await lerTokenDeAcesso();
  if (!usuario || !token) return responder({ estado: "anonimo" }, 401);

  try {
    const itens = await listarHistorico(token);

    // A API ainda não tem `/perfil/historico`: não é erro, é falta de dado.
    if (itens === null) return responder({ estado: "indisponivel" });

    return responder({ estado: "pronto", itens });
  } catch (erro) {
    // A faixa falhar não pode derrubar nada: a home já está na tela.
    console.error("Não consegui buscar o histórico", erro);
    return responder({ estado: "erro" }, 503);
  }
}
