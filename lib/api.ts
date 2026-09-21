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

import type { Genero, ItemHistorico, Midia, Pagina } from "@/lib/tipos";
import { CACHE_TAGS, tagMidia } from "@/lib/cache-tags";

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
  /** Tags de cache. Toda busca deve declarar suas tags. */
  tags: string[];

  /** Segundos até revalidar. `0` desliga o cache (dado por usuário). */
  revalidar?: number;
};

async function buscar<T>(caminho: string, opcoes: Opcoes): Promise<T> {
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

  if (!resposta.ok) {
    throw new ErroDaApi(
      `A API respondeu ${resposta.status} em ${caminho}`,
      resposta.status,
    );
  }

  return resposta.json() as Promise<T>;
}

async function doMock(): Promise<Midia[]> {
  const { default: midias } = await import("@/data/midias.json");
  return midias as Midia[];
}

async function historicoDoMock(): Promise<ItemHistorico[]> {
  const { default: historico } = await import("@/data/historico.json");
  return historico as ItemHistorico[];
}

export type FiltrosCatalogo = {
  tipo?: Midia["tipo"];
  genero?: string;
  q?: string;
};

type RespostaBusca = {
  query: string;
  modo: string;
  usouFallback: boolean;
  itens: Midia[];
};

type RespostaGeneros = {
  id: number;
  nome: string;
}[];

export async function listarMidias(
  filtros: FiltrosCatalogo = {},
): Promise<Pagina<Midia>> {
  if (USAR_MOCK) {
    const todas = await doMock();
    const q = filtros.q?.trim().toLowerCase();

    const itens = todas.filter(
      (m) =>
        (!filtros.tipo || m.tipo === filtros.tipo) &&
        (!filtros.genero || m.generos.some((g) => g === filtros.genero)) &&
        (!q || m.titulo.toLowerCase().includes(q)),
    );

    return {
      itens,
      pagina: 1,
      porPagina: itens.length,
      total: itens.length,
    };
  }

  /**
   * A busca textual usa /busca, que possui um formato de resposta diferente
   * da listagem normal de /midias.
   *
   * A tag continua sendo `midias`, pois a busca faz parte do catálogo.
   */
  if (filtros.q?.trim()) {
    const params = new URLSearchParams();

    params.set("q", filtros.q.trim());

    if (filtros.tipo) {
      params.set("tipo", filtros.tipo);
    }

    if (filtros.genero) {
      params.set("genero", filtros.genero);
    }

    const resultado = await buscar<RespostaBusca>(`/busca?${params}`, {
      tags: [CACHE_TAGS.MIDIAS],
      revalidar: 300,
    });

    return {
      itens: resultado.itens,
      pagina: 1,
      porPagina: resultado.itens.length,
      total: resultado.itens.length,
    };
  }

  const params = new URLSearchParams();

  if (filtros.tipo) {
    params.set("tipo", filtros.tipo);
  }

  if (filtros.genero) {
    params.set("genero", filtros.genero);
  }

  return buscar<Pagina<Midia>>(`/midias?${params}`, {
    tags: [CACHE_TAGS.MIDIAS],
    revalidar: 300,
  });
}

export async function buscarMidia(slug: string): Promise<Midia | null> {
  if (USAR_MOCK) {
    const todas = await doMock();

    return todas.find((m) => m.slug === slug) ?? null;
  }

  try {
    /**
     * A ficha recebe duas tags:
     *
     * `midias`       -> permite invalidar o catálogo inteiro.
     * `midia:<slug>` -> permite invalidar somente esta mídia.
     */
    return await buscar<Midia>(`/midias/${slug}`, {
      tags: [CACHE_TAGS.MIDIAS, tagMidia(slug)],
      revalidar: 300,
    });
  } catch (erro) {
    if (erro instanceof ErroDaApi && erro.status === 404) {
      return null;
    }

    throw erro;
  }
}

export async function listarGeneros(): Promise<Genero[]> {
  if (USAR_MOCK) {
    const todas = await doMock();
    const unicos = new Set(todas.flatMap((m) => m.generos));

    return [...unicos].toSorted((a, b) =>
      a.localeCompare(b, "pt-BR"),
    );
  }

  /**
   * A API retorna objetos { id, nome }, mas a aplicação usa apenas o nome
   * dos gêneros no componente dos chips.
   *
   * Por isso a resposta é normalizada aqui antes de chegar à interface.
   */
  const generos = await buscar<RespostaGeneros>("/generos", {
    tags: [CACHE_TAGS.GENEROS],
    revalidar: 3600,
  });

  return generos.map((genero) => genero.nome) as Genero[];
}

export async function listarHistorico(): Promise<ItemHistorico[]> {
  if (USAR_MOCK) {
    return historicoDoMock();
  }

  try {
    const { itens } = await buscar<{ itens: ItemHistorico[] }>(
      "/perfil/historico",
      {
        tags: [],
        revalidar: 0,
      },
    );

    return itens;
  } catch (erro) {
    if (erro instanceof ErroDaApi && erro.status === 404) {
      return [];
    }

    throw erro;
  }
}