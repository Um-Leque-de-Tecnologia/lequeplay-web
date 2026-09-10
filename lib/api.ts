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
import { cache } from "react";

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

async function historicoDoMock(): Promise<ItemHistorico[]> {
  const { default: historico } = await import("@/data/historico.json");
  return historico as ItemHistorico[];
}

/* -------------------------------------------------------------------------
   O que as telas usam.
   ------------------------------------------------------------------------- */

export type FiltrosCatalogo = {
  tipo?: Midia["tipo"];
  /**
   * **Singular de propósito.** O campo da resposta virou `generos` (lista),
   * mas o parâmetro de query de `GET /v1/midias` continua `?genero=`, no
   * singular: filtra-se por um gênero de cada vez, e o nome do parâmetro é
   * parte da URL — mexer nele quebraria todo link já compartilhado.
   * Campo e parâmetro não precisam ter o mesmo nome.
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
        // Um gênero pedido, vários no título: agora é "está na lista?",
        // e não mais igualdade. A API faz o mesmo do lado dela.
        (!filtros.genero || m.generos.some((g) => g === filtros.genero)) &&
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

export const buscarMidia = cache(async (slug: string): Promise<Midia | null> => {

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
});

/**
 * Os gêneros que existem no acervo, em ordem alfabética.
 *
 * Não é uma lista chumbada no front: gênero novo entra no catálogo sem
 * ninguém publicar o site de novo. O tipo `Genero` continua sendo a união
 * fechada porque ele descreve o que a API pode mandar — a lista de valores é
 * dado, o conjunto de valores possíveis é contrato.
 */
export async function listarGeneros(): Promise<Genero[]> {
  if (USAR_MOCK) {
    const todas = await doMock();
    // `Set` porque o mesmo gênero aparece em vários títulos.
    const unicos = new Set(todas.flatMap((m) => m.generos));

    // `localeCompare` com "pt-BR", e não `sort()` cru: a ordenação padrão é
    // por código UTF-16, onde toda letra acentuada vem depois do Z. Nela um
    // gênero como "Ópera" cairia no fim da lista, atrás de "Tecnologia".
    // Com a locale, "Ó" ordena junto de "O", que é onde a pessoa procura.
    return [...unicos].toSorted((a, b) => a.localeCompare(b, "pt-BR"));
  }

  // Muda quando o catálogo muda, ou seja: quase nunca. Uma hora de cache.
  const { itens } = await buscar<{ itens: Genero[] }>("/generos", {
    tags: ["generos"],
    revalidar: 3600,
  });

  return itens;
}

/**
 * O histórico do player: onde a pessoa parou em cada título que começou.
 *
 * Vem sem duração e sem título — só o `midiaSlug` e a posição. Quem quiser
 * mostrar capa, nome ou porcentagem cruza com `listarMidias`.
 */
export async function listarHistorico(): Promise<ItemHistorico[]> {
  if (USAR_MOCK) return historicoDoMock();

  // `revalidar: 0` porque isto é dado de uma pessoa só: cachear serviria o
  // progresso de alguém para outra pessoa.
  const { itens } = await buscar<{ itens: ItemHistorico[] }>(
    "/perfil/historico",
    { revalidar: 0 },
  );

  return itens;
}
