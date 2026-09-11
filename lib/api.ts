/**
 * A camada que conversa com a API do LequePlay.
 *
 * Regra da casa: componentes não chamam `fetch` diretamente.
 * Tudo passa por aqui para centralizar URL, erros e cache.
 */

import type { Genero, ItemHistorico, Midia, Pagina } from "@/lib/tipos";

const BASE = process.env.API_URL;
const USAR_MOCK = process.env.USAR_MOCK !== "false";

/** Erro com o status HTTP preservado. */
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
  /** Tags de cache. */
  tags?: string[];

  /** Segundos até revalidar. */
  revalidar?: number;
};

async function buscar<T>(
  caminho: string,
  opcoes: Opcoes = {},
): Promise<T> {
  if (!BASE) {
    throw new ErroDaApi(
      "API_URL não está configurada. Veja o .env.example",
      500,
    );
  }

  const resposta = await fetch(`${BASE}${caminho}`, {
    next: {
      tags: opcoes.tags,
      revalidate: opcoes.revalidar,
    },
  });

  // 404 e 500 chegam como resposta normal do fetch.
  if (!resposta.ok) {
    throw new ErroDaApi(
      `A API respondeu ${resposta.status} em ${caminho}`,
      resposta.status,
    );
  }

  return resposta.json() as Promise<T>;
}

/* -------------------------------------------------------------------------
   Enquanto o backend não sobe: dados locais.
   ------------------------------------------------------------------------- */

async function doMock(): Promise<Midia[]> {
  const { default: midias } = await import("@/data/midias.json");

  return midias as Midia[];
}

async function historicoDoMock(): Promise<ItemHistorico[]> {
  const { default: historico } =
    await import("@/data/historico.json");

  return historico as ItemHistorico[];
}

/* -------------------------------------------------------------------------
   O que as telas usam.
   ------------------------------------------------------------------------- */

export type FiltrosCatalogo = {
  tipo?: Midia["tipo"];

  /**
   * O parâmetro da API continua sendo `genero`.
   */
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
        (!filtros.genero ||
          m.generos.some((g) => g === filtros.genero)) &&
        (!q || m.titulo.toLowerCase().includes(q)),
    );

    return {
      itens,
      pagina: 1,
      porPagina: itens.length,
      total: itens.length,
    };
  }

  const params = new URLSearchParams(
    Object.entries(filtros).filter(
      ([, v]) => Boolean(v),
    ) as [string, string][],
  );

  return buscar<Pagina<Midia>>(`/midias?${params}`, {
    tags: ["midias"],
    revalidar: 300,
  });
}

export async function buscarMidia(
  slug: string,
): Promise<Midia | null> {
  if (USAR_MOCK) {
    const todas = await doMock();

    return (
      todas.find((m) => m.slug === slug) ?? null
    );
  }

  try {
    return await buscar<Midia>(`/midias/${slug}`, {
      tags: ["midias", `midia:${slug}`],
      revalidar: 300,
    });
  } catch (erro) {
    // 404 significa que a mídia não existe.
    if (
      erro instanceof ErroDaApi &&
      erro.status === 404
    ) {
      return null;
    }

    throw erro;
  }
}

/**
 * Lista os gêneros existentes no catálogo.
 */
export async function listarGeneros(): Promise<Genero[]> {
  if (USAR_MOCK) {
    const todas = await doMock();

    const unicos = new Set(
      todas.flatMap((m) => m.generos),
    );

    return [...unicos].toSorted((a, b) =>
      a.localeCompare(b, "pt-BR"),
    );
  }

  const { itens } = await buscar<{ itens: Genero[] }>(
    "/generos",
    {
      tags: ["generos"],
      revalidar: 3600,
    },
  );

  return itens;
}

/**
 * Retorna o histórico de onde a pessoa parou de assistir.
 */
export async function listarHistorico(): Promise<
  ItemHistorico[]
> {
  if (USAR_MOCK) {
    return historicoDoMock();
  }

  // Histórico é dado específico do usuário, por isso não usamos cache.
  const { itens } = await buscar<{
    itens: ItemHistorico[];
  }>("/perfil/historico", {
    revalidar: 0,
  });

  return itens;
}