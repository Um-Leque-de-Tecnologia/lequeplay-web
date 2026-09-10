/**
 * O domínio do LequePlay.
 *
 * `Midia` é uma união discriminada pelo campo `tipo`. Isso não é enfeite:
 * é o que faz o TypeScript saber que `diretor` só existe em filme e
 * `temporadas` só existe em série — sem cast, sem `any`, sem `!`.
 *
 * Os nomes daqui são os nomes que a API manda. Quando os dois lados
 * discordavam, quem mudou foi o front: renomear um campo no TypeScript custa
 * um `Ctrl+R`; renomear na API quebra todo mundo que já consome.
 */

export type Genero =
  | "Ação"
  | "Comédia"
  | "Documentário"
  | "Drama"
  | "Ficção científica"
  | "Suspense"
  | "Tecnologia";

/** O que todo título tem, seja filme, série ou podcast. */
type MidiaBase = {
  id: string;
  slug: string;
  titulo: string;
  ano: number;
  /**
   * Lista, não um valor só: um título pode ser drama *e* suspense. Vem
   * ordenada por relevância, então `generos[0]` é o gênero principal.
   *
   * Cuidado: o **filtro** de `GET /v1/midias` continua sendo `?genero=`, no
   * singular — só o campo da resposta é plural.
   */
  generos: Genero[];
  sinopse: string;
  /**
   * A API **omite** o campo quando o título não tem capa; ela não manda
   * `null`. Por isso é `?: string` — o valor ausente é `undefined`.
   */
  posterUrl?: string;
  /**
   * Sempre um número — a API nunca manda `null` aqui. Quem responde
   * "ninguém avaliou" é `totalAvaliacoes === 0`, não a nota.
   */
  notaMedia: number;
  /** `0` quando ninguém avaliou ainda. É este campo que separa os casos. */
  totalAvaliacoes: number;
  /**
   * Somado pelo backend: o front nao tem os episodios para calcular.
   *
   * Opcional pela mesma razao que `posterUrl`: a API **omite** o campo quando
   * nao tem o numero (`omitempty` no Go) — e omite de verdade, nao so em
   * teoria. Em `GET /v1/midias` na producao, 17 dos 60 titulos vem sem ele,
   * todos series sem runtime na TMDB. Declarar `number` aqui nao faz o dado
   * aparecer: so faz `formatarDuracao` receber `undefined` e escrever
   * "NaNmin" na ficha. Faltando, a linha da duracao nao e exibida.
   */
  duracaoMin?: number;
  /** Só vem no detalhe, nunca na listagem. No máximo 12. */
  creditos?: Credito[];
};

export type Filme = MidiaBase & {
  tipo: "filme";
  /**
   * A API **não** manda este campo solto: ela manda `creditos`, e a direção é
   * o crédito com `papel: "direcao"`. Aqui ele já vem derivado — o mock de
   * `data/midias.json` grava direto, e quando a tela passar a ler a API de
   * verdade é do `creditos` que ele sai. Um dado, uma fonte da verdade.
   */
  diretor: string;
};

export type Episodio = {
  /**
   * A posição dentro da temporada, começando em `1`. Diferente de
   * `Temporada.numero`, aqui não há buraco nem episódio zero.
   */
  numero: number;
  titulo: string;
  /** Sempre presente no episódio — quem pode faltar é a soma da série. */
  duracaoMin: number;
};

/** Os dados da temporada sem a lista de episódios. */
export type ResumoTemporada = {
  /**
   * O número que a emissora deu à temporada — **não é a posição no array.**
   * Os dois costumam coincidir e por isso a diferença passa despercebida,
   * mas não coincidem sempre: temporada de especiais é a `0`, e série que
   * mudou de nome ou de canal entra no acervo já na `2`. Quem monta o
   * seletor lê `numero`; quem lê o índice acerta na maioria e erra em
   * silêncio no resto.
   */
  numero: number;
  ano: number;
  /** Igual a `episodios.length` — vem repetido porque o resumo pode vir só. */
  totalEpisodios: number;
};

/** A temporada inteira: o resumo mais os episódios, em ordem de exibição. */
export type Temporada = ResumoTemporada & {
  episodios: Episodio[];
};

export type Serie = MidiaBase & {
  tipo: "serie";
  /**
   * As temporadas vêm **completas**, com os episódios dentro, e não como
   * `ResumoTemporada`. A série tem meia dúzia de temporadas, não mil: mandar
   * tudo de uma vez custa alguns kB e poupa uma ida ao servidor toda vez que
   * a pessoa troca de temporada. O endpoint
   * `GET /midias/{slug}/temporadas/{numero}` continua existindo para quem
   * quer uma só, mas a ficha não precisa dele.
   *
   * Ordenadas por `numero` crescente — a de especiais, quando existe, vem
   * primeiro, porque `0` é menor que `1`.
   */
  temporadas: Temporada[];
};

export type EpisodioPodcast = {
  numero: number;
  titulo: string;
  duracaoMin: number;
  /** Data em formato ISO (ex: "2025-03-12"). */
  publicadoEm: string;
};

export type Podcast = MidiaBase & {
  tipo: "podcast";
  /** Como `diretor`: derivado do crédito com `papel: "apresentacao"`. */
  apresentador: string;
  totalEpisodios: number;
  frequencia?: string;
  episodios?: EpisodioPodcast[];
};

/**
 * Deriva o nome de quem apresenta a partir de `creditos`.
 * No LequePlay, a apresentação não é um campo escalar: vem do crédito
 * onde `papel === "apresentacao"`.
 */
export function obterApresentador(midia: Podcast): string {
  const credito = midia.creditos?.find((c) => c.papel === "apresentacao");
  return credito?.pessoa.nome ?? midia.apresentador ?? "";
}

export type Midia = Filme | Serie | Podcast;


/* ------------------------------------------------------------------ *
 * Pessoas — quem dirige, atua ou apresenta
 * ------------------------------------------------------------------ */

export type Papel = "direcao" | "elenco" | "apresentacao";

export type Pessoa = {
  id: string;
  slug: string;
  nome: string;
  bio: string;
  fotoUrl: string | null;
  papeis: Papel[];
};

export type Credito = {
  pessoa: Pick<Pessoa, "slug" | "nome" | "fotoUrl">;
  papel: Papel;
  /** Só existe quando `papel` é `"elenco"`. */
  personagem: string | null;
};

/* ------------------------------------------------------------------ *
 * Progresso — onde a pessoa parou
 * ------------------------------------------------------------------ */

/**
 * Uma linha do histórico do player: um título que a pessoa começou e a
 * posição em que ela largou.
 *
 * O registro guarda **onde parou**, não quanto falta: a porcentagem sai de
 * dividir `segundosAssistidos` pela duração — que mora na mídia ou no
 * episódio, nunca aqui. Um dado, uma fonte da verdade: se a duração fosse
 * copiada para cá, ela envelheceria na hora em que o catálogo corrigisse o
 * runtime de um título.
 */
export type ItemHistorico = {
  midiaSlug: string;
  /**
   * Os dois só vêm quando o player soube dizer qual episódio estava tocando.
   * O player antigo gravava só o título, e essas linhas continuam no
   * histórico: para elas, a única duração disponível é a da mídia inteira.
   * Séries e podcasts com progresso solto são justamente esses.
   */
  temporadaNumero?: number;
  episodioNumero?: number;
  /** Quanto já rodou, em segundos. `0` é possível: abriu e fechou. */
  segundosAssistidos: number;
  /**
   * ISO com fuso. É o instante do último "salvar posição" — e é por ele que
   * "continuar assistindo" se ordena, do mais recente para o mais antigo.
   * A API devolve na ordem em que gravou, que não é a mesma coisa.
   */
  atualizadoEm: string;
};

/* ------------------------------------------------------------------ *
 * Camada social
 * ------------------------------------------------------------------ */

/**
 * A versão enxuta de um título, embutida onde o objeto inteiro seria
 * desperdício: dentro de uma resenha, de um registro do diário, do feed.
 */
export type ResumoMidia = {
  slug: string;
  titulo: string;
  /** Mesmo nome e mesma regra de `Midia.posterUrl`: some quando não há capa. */
  posterUrl?: string;
};

/** Quem escreveu, curtiu ou seguiu. */
export type Autor = {
  usuario: string;
  nome: string;
  avatarUrl: string | null;
};

export type Resenha = {
  id: string;
  midia: ResumoMidia;
  autor: Autor;
  /** `null` quando a pessoa escreveu sem dar nota — é permitido. */
  nota: number | null;
  texto: string;
  contemSpoiler: boolean;
  curtidas: number;
  /** Só vem verdadeiro em chamada autenticada; nas públicas é sempre false. */
  curtidaPeloUsuario: boolean;
  criadaEm: string;
  atualizadaEm: string;
};

/**
 * O que o formulário da ficha manda no `PUT /midias/{id}/resenha` — o corpo
 * da requisição, não a resenha salva. Os campos que a API gera (`id`,
 * `curtidas`, as datas) não estão aqui de propósito: quem os inventa é o
 * servidor, e um rascunho que já carrega `id` convida alguém a mandá-lo.
 */
export type RascunhoResenha = {
  midiaSlug: string;
  texto: string;
  /** `null` quando a pessoa escreve sem dar nota — é permitido. */
  nota: number | null;
  contemSpoiler: boolean;
};

/**
 * O tamanho que a API aceita em `texto`. Está aqui, e não chumbado no JSX,
 * porque duas telas precisam do mesmo número: o contador embaixo do campo e
 * a validação antes de enviar. Dois lugares com o mesmo literal viram um
 * lugar só que ninguém atualizou.
 */
export const LIMITE_TEXTO_RESENHA = { minimo: 10, maximo: 5000 } as const;

/** O que a listagem de listas devolve: sem os itens, só o mosaico de capas. */
export type ResumoLista = {
  id: string;
  slug: string;
  titulo: string;
  descricao: string;
  autor: Autor;
  publica: boolean;
  totalItens: number;
  /** As 4 primeiras capas, para o mosaico. Vazio se a lista estiver vazia. */
  capas: string[];
  curtidas: number;
  criadaEm: string;
};

/** O que GET /listas/{slug} devolve: o resumo mais os itens, em ordem. */
export type Lista = ResumoLista & {
  itens: { midia: ResumoMidia; ordem: number }[];
};

export type RegistroDiario = {
  id: string;
  midia: ResumoMidia;
  /** Data, não instante: "2026-08-20". Ninguém anota a hora que assistiu. */
  assistidoEm: string;
  nota: number | null;
  /** Aponta para a resenha, quando a pessoa escreveu uma. */
  resenhaId: string | null;
  /** A mesma mídia pode ter vários registros — assistir de novo conta. */
  revisita: boolean;
};

export type EstatisticasPerfil = {
  assistidas: number;
  resenhas: number;
  listas: number;
  seguidores: number;
  seguindo: number;
};

export type UsuarioPublico = {
  /** O handle, único, que aparece na URL. */
  usuario: string;
  nome: string;
  bio: string;
  avatarUrl: string | null;
  estatisticas: EstatisticasPerfil;
  seguidoPeloUsuario: boolean;
};

/**
 * Uma linha do feed. Discriminada por `tipo` como a `Midia`, e pelo mesmo
 * motivo: cada tipo renderiza uma frase diferente, e o TypeScript é quem
 * garante que nenhum caso ficou de fora do `switch`.
 */
type AtividadeBase = {
  id: string;
  usuario: Autor;
  midia: ResumoMidia;
  ocorridoEm: string;
};

export type Atividade =
  | (AtividadeBase & { tipo: "resenha"; resenhaId: string })
  | (AtividadeBase & { tipo: "diario"; nota: number | null })
  | (AtividadeBase & { tipo: "lista"; listaSlug: string; listaTitulo: string })
  | (AtividadeBase & { tipo: "curtida"; resenhaId: string });


/** Resposta paginada da API. */
export type Pagina<T> = {
  itens: T[];
  pagina: number;
  porPagina: number;
  total: number;
};
