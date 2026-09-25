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

import { CACHE_TAGS, tagMidia } from "@/lib/cache-tags";
import type {
  CredenciaisDeLogin,
  Genero,
  ItemHistorico,
  Midia,
  Pagina,
  TokensDaSessao,
  UsuarioDaSessao,
} from "@/lib/tipos";
import { cache } from "react";

const BASE = process.env.API_URL;
const USAR_MOCK = process.env.USAR_MOCK !== "false";

/**
 * Quanto tempo esperar a API antes de desistir.
 *
 * Sem limite, uma API lenta não vira erro: vira página pendurada. O servidor
 * fica segurando a renderização, e quem está do outro lado não recebe nem o
 * conteúdo nem uma explicação. Dez segundos é folgado para o que o contrato
 * promete (até 300ms nas listagens) e curto o bastante para a espera virar
 * uma tela de erro enquanto a pessoa ainda está olhando.
 */
const TEMPO_LIMITE_API_MS = 10_000;

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
  /**
   * As etiquetas de cache desta busca, para invalidar com `revalidateTag`
   * depois. Os nomes estão em `lib/cache-tags.ts`, e o esquema inteiro em
   * `docs/cache-tags.md`.
   *
   * **Obrigatório de propósito.** Uma busca cacheada sem etiqueta não tem
   * como ser invalidada: ela fica servindo resposta velha até o tempo de
   * revalidação passar, e nenhum erro aparece para avisar. Exigir o campo no
   * tipo faz o compilador cobrar a decisão de quem escrever a próxima busca —
   * e quem não quiser cache nenhum escreve `tags: []`, que é uma escolha
   * registrada, e não um esquecimento.
   */
  tags: string[];
  /** Segundos até revalidar. `0` desliga o cache (dado por usuário). */
  revalidar?: number;
  /**
   * Desliga o cache inteiro (`cache: "no-store"`).
   *
   * Existe para uma busca só, e é o ponto do LP-310: a versão do catálogo.
   * Um vigia que lê valor guardado não vigia nada — ele responderia "não
   * mudou" com a resposta de cinco minutos atrás, para sempre, e a
   * invalidação nunca aconteceria.
   *
   * Para qualquer outra busca, o caminho é `revalidar` + `tags`: dado que não
   * se cacheia é exceção, e exceção precisa ser declarada.
   */
  semCache?: boolean;
};

// Sem valor padrão para `opcoes`: com `tags` obrigatório no tipo, um `= {}`
// aqui daria de volta, na porta dos fundos, a busca sem etiqueta que o campo
// obrigatório existe para impedir.
async function buscar<T>(caminho: string, opcoes: Opcoes): Promise<T> {
  if (!BASE) {
    throw new ErroDaApi("API_URL não está configurada. Veja o .env.example", 500);
  }

  try {
    const resposta = await fetch(`${BASE}${caminho}`, {
      // `no-store` e `next` são exclusivos: um diz "nunca guarde", o outro diz
      // por quanto tempo guardar. Mandar os dois é deixar o Next escolher, e a
      // escolha dele pode não ser a que está escrita aqui.
      ...(opcoes.semCache
        ? { cache: "no-store" as const }
        : { next: { tags: opcoes.tags, revalidate: opcoes.revalidar } }),
      // O sinal cobre a requisição inteira, inclusive a leitura do corpo:
      // uma API que manda os cabeçalhos depressa e trava no meio do JSON
      // também é uma espera sem fim, e o relógio precisa alcançar esse caso.
      signal: AbortSignal.timeout(TEMPO_LIMITE_API_MS),
    });

    // `fetch` só rejeita quando a REDE falha. 404 e 500 chegam aqui como
    // resposta normal — sem esta checagem, o `.json()` abaixo tentaria
    // interpretar uma página de erro e falharia com uma mensagem
    // incompreensível sobre token inesperado.
    if (!resposta.ok) {
      if (resposta.status === 401 || resposta.status === 403) {
        // Credencial recusada é alarme, e não "erro do dia": a chave do
        // servidor está errada, vencida ou foi revogada, e nenhuma pessoa
        // usando o site consegue fazer nada a respeito. Quem precisa ver
        // isto é quem opera.
        console.error(
          `A API recusou a credencial (${resposta.status}) em ${caminho}`,
        );
      } else {
        console.error(`A API respondeu ${resposta.status} em ${caminho}`);
      }

      throw new ErroDaApi(
        `A API respondeu ${resposta.status} em ${caminho}`,
        resposta.status,
      );
    }

    return (await resposta.json()) as T;
  } catch (erro) {
    // Já classificado acima, com o status que a API mandou: sobe como está.
    // Sem esta linha, o `catch` transformaria um 404 em 503 e a ficha de um
    // título inexistente viraria tela de erro em vez de 404.
    if (erro instanceof ErroDaApi) throw erro;

    if (erro instanceof Error && erro.name === "TimeoutError") {
      console.error(
        `A API passou de ${TEMPO_LIMITE_API_MS}ms em ${caminho}`,
      );
      throw new ErroDaApi("A API demorou mais que o tempo esperado", 408);
    }

    // Rede: DNS, conexão recusada, TLS. O erro cru não serve para a tela —
    // vira `ErroDaApi` para quem chama continuar decidindo pelo status.
    console.error(`Falha ao conectar com a API em ${caminho}`, erro);
    throw new ErroDaApi("Não foi possível alcançar a API", 503);
  }
}

/* -------------------------------------------------------------------------
   A conta: login, renovação, saída e quem está logado.
   ------------------------------------------------------------------------- */

/**
 * Um POST na API, com o mesmo tratamento de erro e o mesmo tempo limite das
 * buscas.
 *
 * Separado do `buscar` porque as duas coisas diferem no que importa: isto
 * **nunca** é cacheado (é escrita, e resposta de credencial não se guarda) e
 * manda corpo. Reaproveitar o `buscar` aqui significaria um parâmetro a mais
 * em toda busca do catálogo para atender um caso que nenhuma delas tem.
 */
async function enviar<T>(
  caminho: string,
  corpo: unknown,
  cabecalhos: Record<string, string> = {},
): Promise<T> {
  if (!BASE) {
    throw new ErroDaApi("API_URL não está configurada. Veja o .env.example", 500);
  }

  try {
    const resposta = await fetch(`${BASE}${caminho}`, {
      method: "POST",
      headers: { "content-type": "application/json", ...cabecalhos },
      body: JSON.stringify(corpo),
      cache: "no-store",
      signal: AbortSignal.timeout(TEMPO_LIMITE_API_MS),
    });

    if (!resposta.ok) {
      // O corpo de erro da API traz `detail` com mensagem interna do Keycloak
      // ("Invalid user credentials", "oidc: malformed jwt…"). Ele NÃO é lido
      // aqui de propósito: o que sobe é o status, e a tela escolhe a frase.
      throw new ErroDaApi(
        `A API respondeu ${resposta.status} em ${caminho}`,
        resposta.status,
      );
    }

    // 204 (o logout) não tem corpo: `json()` quebraria numa saída bem
    // sucedida.
    if (resposta.status === 204) return undefined as T;

    return (await resposta.json()) as T;
  } catch (erro) {
    if (erro instanceof ErroDaApi) throw erro;

    if (erro instanceof Error && erro.name === "TimeoutError") {
      console.error(`A API passou de ${TEMPO_LIMITE_API_MS}ms em ${caminho}`);
      throw new ErroDaApi("A API demorou mais que o tempo esperado", 408);
    }

    console.error(`Falha ao conectar com a API em ${caminho}`, erro);
    throw new ErroDaApi("Não foi possível alcançar a API", 503);
  }
}

/**
 * Troca usuário e senha pelo par de tokens.
 *
 * Credencial errada e usuário inexistente devolvem o **mesmo** 401 na API — e
 * é assim que tem de ser: dizer qual dos dois falhou entrega quais usuários
 * existem na base.
 */
export async function entrarNaConta(
  credenciais: CredenciaisDeLogin,
): Promise<TokensDaSessao> {
  return enviar<TokensDaSessao>("/auth/login", credenciais);
}

/** Troca o token de renovação por um par novo. */
export async function renovarSessao(
  refreshToken: string,
): Promise<TokensDaSessao> {
  return enviar<TokensDaSessao>("/auth/refresh", { refreshToken });
}

/**
 * Avisa a API que a sessão acabou (responde 204).
 *
 * Mata o token de **renovação**. O de acesso é um JWT e continua válido até
 * vencer — é por isso que ele vive minutos, e não horas.
 */
export async function sairDaConta(refreshToken: string): Promise<void> {
  await enviar<void>("/auth/logout", { refreshToken });
}

/**
 * A única porta por onde o token de uma pessoa sai para a API (LP-411).
 *
 * **Resposta de uma pessoa não entra no cache.** Por isso esta função não tem
 * `opcoes`: não existe `revalidar`, `tags` nem `semCache` para escolher —
 * é sempre `cache: "no-store"`. Quem precisar mandar um token passa por aqui,
 * e fica sem como errar.
 *
 * O motivo de a regra ser de código, e não de revisão: a documentação do
 * `fetch` da versão instalada diz que o cache guarda "any request, including
 * `POST` and requests that send `authorization` or `cookie` headers". Com o
 * `/me` guardado por `revalidate: 3600`, cada pessoa continuou vendo o
 * próprio perfil (o cache separa pelo cabeçalho) — mas um token **vencido**
 * continuou abrindo o `/perfil`, com o `/me` chamado zero vezes: a resposta
 * guardada dizia que o token valia. Opção de cache em chamada com token é bug
 * até prova em contrário.
 *
 * O `buscar` lá de cima, que cacheia, não tem parâmetro de cabeçalho — e é
 * de propósito que continue sem.
 */
async function buscarComToken<T>(caminho: string, tokenDeAcesso: string): Promise<T> {
  if (!BASE) {
    throw new ErroDaApi("API_URL não está configurada. Veja o .env.example", 500);
  }

  const resposta = await fetch(`${BASE}${caminho}`, {
    headers: { Authorization: `Bearer ${tokenDeAcesso}` },
    cache: "no-store",
    signal: AbortSignal.timeout(TEMPO_LIMITE_API_MS),
  });

  if (!resposta.ok) {
    // 401 aqui é o caso normal de token vencido ou inválido, e não alarme:
    // quem chama decide (o `/perfil` manda ao login). O status sobe intacto.
    throw new ErroDaApi(
      `A API respondeu ${resposta.status} em ${caminho}`,
      resposta.status,
    );
  }

  return (await resposta.json()) as T;
}

/**
 * Quem é o dono deste token, perguntado à API.
 *
 * Ter o cookie não prova nada: qualquer pessoa escreve um no navegador. Quem
 * sabe se o token vale é o `/auth/me`, e ele responde 401 quando não vale —
 * inclusive para token vencido e para token malformado, que são o mesmo caso
 * do ponto de vista de quem chama.
 *
 * Nunca cacheado: passa pelo `buscarComToken`, que não sabe cachear.
 */
export async function buscarUsuarioDaSessao(
  tokenDeAcesso: string,
): Promise<UsuarioDaSessao> {
  return buscarComToken<UsuarioDaSessao>("/auth/me", tokenDeAcesso);
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

/**
 * O catálogo, com filtros.
 *
 * Envolvida em `cache()` pelo mesmo motivo de `buscarMidia`: a home e a faixa
 * "Em alta" pedem o catálogo na mesma renderização, e sem isso seriam duas
 * idas à API por visita.
 *
 * A dedupe vale para chamadas com os **mesmos argumentos**, e o `cache()`
 * compara por identidade: `listarMidias()` duas vezes é uma busca só, mas
 * `listarMidias({ tipo: "filme" })` em dois lugares são dois objetos
 * diferentes, e portanto duas buscas. Quem precisar dedupar com filtro passa
 * o mesmo objeto aos dois.
 */
export const listarMidias = cache(async function listarMidias(
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
    tags: [CACHE_TAGS.MIDIAS],
    // Uma hora, e o motivo: o catálogo muda por **ingestão**, não por minuto.
    // Entre duas ingestões, buscar de novo devolve byte a byte a mesma coisa.
    //
    // Este número é rede de segurança, não o caminho normal: quem faz a
    // mudança aparecer é o vigia do LP-310, que invalida a etiqueta `midias`
    // assim que a versão do catálogo sobe. A hora é o teto de quanto tempo o
    // site serviria dado velho se o vigia estivesse parado.
    //
    // E a promessa do campo é "não busco de novo antes de N segundos" — e não
    // "o que você vê tem no máximo N segundos". Sem visita, o dado guardado
    // envelhece à vontade.
    revalidar: 3600,
  });
});

export const buscarMidia = cache(async (slug: string): Promise<Midia | null> => {

  if (USAR_MOCK) {
    const todas = await doMock();
    return todas.find((m) => m.slug === slug) ?? null;
  }

  try {
    return await buscar<Midia>(`/midias/${slug}`, {
      tags: [CACHE_TAGS.MIDIAS, tagMidia(slug)],
      // Mesma hora do catálogo, e pela mesma razão: a ficha muda quando o
      // título muda, e isso vem por ingestão. A diferença é que esta busca
      // tem etiqueta própria (`midia:<slug>`), então dá para derrubar só ela
      // quando um título específico for corrigido, sem tocar no resto.
      revalidar: 3600,
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
    tags: [CACHE_TAGS.GENEROS],
    revalidar: 3600,
  });

  return itens;
}

/**
 * A versão do catálogo: um contador que a API incrementa a cada ingestão.
 *
 * **A única busca do projeto que nunca é cacheada.** Ela existe para
 * responder "mudou desde a última vez que olhei?", e uma resposta guardada
 * responde sempre a mesma coisa — o vigia do LP-310 passaria a vida dizendo
 * "não mudou" com a leitura de cinco minutos atrás.
 *
 * Sem etiqueta pelo mesmo motivo: não há cache para invalidar.
 */
export async function buscarVersaoDoCatalogo(): Promise<number> {
  if (USAR_MOCK) {
    // Com o mock não existe ingestão: o catálogo é um arquivo no repositório,
    // e a versão só muda quando alguém edita e publica. Devolver um número
    // fixo mantém o vigia honesto — ele diz "não mudou", que é a verdade.
    return 1;
  }

  const { versao } = await buscar<{ versao: number }>("/catalogo/versao", {
    tags: [],
    semCache: true,
  });

  return versao;
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
  try {
    const { itens } = await buscar<{ itens: ItemHistorico[] }>(
      "/perfil/historico",
      // Lista vazia, e não ausência: não há o que invalidar aqui, e dizer
      // isso explicitamente é diferente de esquecer a etiqueta.
      { tags: [], revalidar: 0 },
    );

    return itens;
  } catch (erro) {
    if (erro instanceof ErroDaApi && erro.status === 404) {
      return [];
    }

    throw erro;
  }
}
