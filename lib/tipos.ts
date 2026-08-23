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


/** Resposta paginada da API. */
export type Pagina<T> = {
  itens: T[];
  pagina: number;
  porPagina: number;
  total: number;
};
