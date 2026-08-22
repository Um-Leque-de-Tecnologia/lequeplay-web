/**
 * A camada que conversa com a API do LequePlay.
 *
 * Regra da casa: **componente não chama `fetch` direto**. Tudo passa por
 * aqui, para que a URL, o tratamento de erro e as tags de cache fiquem num
 * lugar só.
 *
 * Enquanto a API não está de pé, `USAR_MOCK` serve os dados de
 * `data/midias.json`. Trocar para a API real é mudar o `.env`, não o código
 * das telas.
 */

import type { Midia, Pagina } from "@/lib/tipos";

const BASE = process.env.API_URL;
const USAR_MOCK = process.env.USAR_MOCK !== "false";

/** Erro com o status HTTP preservado, para a tela decidir o que mostrar. */
export class ErroDaApi extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ErroDaApi";
  }
}

type Opcoes = {
  /** Tags de cache, para invalidar com `revalidateTag` depois. */
  tags?: string[];
  /** Segundos até revalidar. `0` desliga o cache (dado por usuário). */
  revalidar?: number;
};

async function buscar<T>(caminho: string, opcoes: Opcoes = {}): Promise<T> {
  if (!BASE) {
    throw new ErroDaApi("API_URL não está configurada. Veja o .env.example", 500);
  }

  const resposta = await fetch(`${BASE}${caminho}`, {
    next: { tags: opcoes.tags, revalidate: opcoes.revalidar },
  });

  // `fetch` só rejeita quando a REDE falha. 404 e 500 chegam aqui como
  // resposta normal — sem esta checagem, o `.json()` abaixo tentaria
  // interpretar uma página de erro e falharia com uma mensagem
  // incompreensível sobre token inesperado.
  if (!resposta.ok) {
    throw new ErroDaApi(
      `A API respondeu ${resposta.status} em ${caminho}`,
      resposta.status,
    );
  }

  return resposta.json() as Promise<T>;
}

/* -------------------------------------------------------------------------
   Enquanto o backend não sobe: os mesmos dados, servidos do arquivo local.
   ------------------------------------------------------------------------- */

async function doMock(): Promise<Midia[]> {
  const { default: midias } = await import("@/data/midias.json");
  return midias as Midia[];
}

/* -------------------------------------------------------------------------
   O que as telas usam.
   ------------------------------------------------------------------------- */

export type FiltrosCatalogo = {
  tipo?: Midia["tipo"];
  genero?: string;
  q?: string;
};

export async function listarMidias(
  filtros: FiltrosCatalogo = {},
): Promise<Pagina<Midia>> {
  if (USAR_MOCK) {
    const todas = await doMock();
    const q = filtros.q?.trim().toLowerCase();

    const itens = todas.filter(
      (m) =>
        (!filtros.tipo || m.tipo === filtros.tipo) &&
        (!filtros.genero || m.genero === filtros.genero) &&
        (!q || m.titulo.toLowerCase().includes(q)),
    );

    return { itens, pagina: 1, porPagina: itens.length, total: itens.length };
  }

  const params = new URLSearchParams(
    Object.entries(filtros).filter(([, v]) => Boolean(v)) as [string, string][],
  );

  return buscar<Pagina<Midia>>(`/midias?${params}`, {
    tags: ["midias"],
    revalidar: 300,
  });
}

export async function buscarMidia(slug: string): Promise<Midia | null> {
  if (USAR_MOCK) {
    const todas = await doMock();
    return todas.find((m) => m.slug === slug) ?? null;
  }

  try {
    return await buscar<Midia>(`/midias/${slug}`, {
      tags: ["midias", `midia:${slug}`],
      revalidar: 300,
    });
  } catch (erro) {
    // 404 não é falha do sistema: é "esse título não existe".
    // Quem chamou decide se mostra o not-found.
    if (erro instanceof ErroDaApi && erro.status === 404) return null;
    throw erro;
  }
}
