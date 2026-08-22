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
  capaUrl: string;
  /** `null` quando ainda ninguém avaliou — diferente de nota zero. */
  notaMedia: number | null;
  totalAvaliacoes: number;
};

export type Filme = MidiaBase & {
  tipo: "filme";
  duracaoMin: number;
  diretor: string;
};

export type Episodio = {
  numero: number;
  titulo: string;
  duracaoMin: number;
};

export type Temporada = {
  numero: number;
  ano: number;
  episodios: Episodio[];
};

export type Serie = MidiaBase & {
  tipo: "serie";
  temporadas: Temporada[];
};

export type Podcast = MidiaBase & {
  tipo: "podcast";
  apresentador: string;
  episodios: Episodio[];
};

export type Midia = Filme | Serie | Podcast;

/**
 * Duração total de qualquer mídia.
 *
 * No curso de Orientação a Objetos isto seria polimorfismo. Em TypeScript é
 * narrowing: dentro de cada `case`, o compilador já sabe qual é o tipo.
 */
export function duracaoTotalMin(midia: Midia): number {
  switch (midia.tipo) {
    case "filme":
      return midia.duracaoMin;
    case "serie":
      return midia.temporadas.reduce(
        (total, t) => total + t.episodios.reduce((s, e) => s + e.duracaoMin, 0),
        0,
      );
    case "podcast":
      return midia.episodios.reduce((s, e) => s + e.duracaoMin, 0);
  }
}

/** Resposta paginada da API. */
export type Pagina<T> = {
  itens: T[];
  pagina: number;
  porPagina: number;
  total: number;
};
