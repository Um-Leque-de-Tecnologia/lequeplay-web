/**
 * O domínio do LequePlay.
 *
 * `Midia` é uma união discriminada pelo campo `tipo`. Isso não é enfeite:
 * é o que faz o TypeScript saber que `duracaoMin` só existe em filme e
 * `temporadas` só existe em série — sem cast, sem `any`, sem `!`.
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
  genero: Genero;
  sinopse: string;
  capaUrl: string | null;
  /** `null` quando ainda ninguém avaliou — diferente de nota zero. */
  notaMedia: number | null;
  totalAvaliacoes: number;
  /** Somado pelo backend: o front nao tem os episodios para calcular. */
  duracaoTotalMin: number;
  /** Só vem no detalhe, nunca na listagem. No máximo 12. */
  creditos?: Credito[];
};

export type Filme = MidiaBase & {
  tipo: "filme";
  diretor: string;
};

export type Episodio = {
  numero: number;
  titulo: string;
  duracaoMin: number;
};

/** O que vem no detalhe da série: só o resumo, sem os episódios. */
export type ResumoTemporada = {
  numero: number;
  ano: number;
  totalEpisodios: number;
};

/** O que vem de GET /midias/{slug}/temporadas/{numero}. */
export type Temporada = ResumoTemporada & {
  episodios: Episodio[];
};

export type Serie = MidiaBase & {
  tipo: "serie";
  temporadas: ResumoTemporada[];
};

export type Podcast = MidiaBase & {
  tipo: "podcast";
  apresentador: string;
  totalEpisodios: number;
};

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
 * Camada social
 * ------------------------------------------------------------------ */

/**
 * A versão enxuta de um título, embutida onde o objeto inteiro seria
 * desperdício: dentro de uma resenha, de um registro do diário, do feed.
 */
export type ResumoMidia = {
  slug: string;
  titulo: string;
  capaUrl: string | null;
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
