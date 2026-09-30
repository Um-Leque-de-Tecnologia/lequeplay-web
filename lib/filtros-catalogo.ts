import type { Midia } from "@/lib/tipos";

/**
 * O que chega em `searchParams` foi digitado, colado ou montado por um link
 * velho. Daqui para baixo a página só enxerga valor conferido.
 */
type Bruto = Record<string, string | string[] | undefined>;

const TIPOS = ["filme", "serie", "podcast"] as const satisfies readonly Midia["tipo"][];

const ORDENS = ["relevancia", "recentes", "nota", "az"] as const;

type Ordem = (typeof ORDENS)[number];

export type FiltrosLidos = {
  tipo?: Midia["tipo"];
  /** Um gênero só. O nome pode trazer `&` — ele entra inteiro, nunca cortado. */
  genero?: string;
  q?: string;
  ordem: Ordem;
};

/** `?genero=A&genero=B` chega como lista. Vale o primeiro. */
function primeiro(valor: string | string[] | undefined) {
  return Array.isArray(valor) ? valor[0] : valor;
}

export function lerFiltros(bruto: Bruto): FiltrosLidos {
  const tipo = primeiro(bruto.tipo);
  const genero = primeiro(bruto.genero);
  const q = primeiro(bruto.q)?.trim();
  const ordem = primeiro(bruto.ordem);

  return {
    // Conjunto fechado: o que não está na lista não existe.
    tipo: TIPOS.find((item) => item === tipo),
    // Conjunto aberto: o nome vem da API, e gênero desconhecido esvazia a grade.
    genero: genero || undefined,
    q: q || undefined,
    ordem: ORDENS.find((item) => item === ordem) ?? "relevancia",
  };
}

/**
 * O endereço sai dos filtros já conferidos.
 *
 * `URLSearchParams` escapa o valor. Três gêneros da API têm `&` no nome
 * (Action & Adventure, Sci-Fi & Fantasy, War & Politics): numa template
 * string, o `&` vira outro parâmetro e a API recebe só a primeira palavra.
 */
export function endereco(filtros: FiltrosLidos) {
  const params = new URLSearchParams();
  if (filtros.tipo) params.set("tipo", filtros.tipo);
  if (filtros.q) params.set("q", filtros.q);
  // Relevância é o padrão: sem `?ordem=`, a URL fica limpa.
  if (filtros.ordem !== "relevancia") params.set("ordem", filtros.ordem);
  if (filtros.genero) params.set("genero", filtros.genero);

  const query = params.toString();
  return query ? `/midias?${query}` : "/midias";
}
