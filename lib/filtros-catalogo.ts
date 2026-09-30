import type { Midia } from "@/lib/tipos";

type Bruto = Record<string, string | string[] | undefined>;

const TIPOS = ["filme", "serie", "podcast"] as const satisfies readonly Midia["tipo"][];

const ORDENS = ["relevancia", "recentes", "nota", "az"] as const;

type Ordem = (typeof ORDENS)[number];

export type FiltrosLidos = {
  tipo?: Midia["tipo"];
  genero?: string;
  q?: string;
  ordem: Ordem;
};

function primeiro(valor: string | string[] | undefined) {
  return Array.isArray(valor) ? valor[0] : valor;
}

export function lerFiltros(bruto: Bruto): FiltrosLidos {
  const tipo = primeiro(bruto.tipo);
  const genero = primeiro(bruto.genero);
  const q = primeiro(bruto.q)?.trim();
  const ordem = primeiro(bruto.ordem);

  return {
    tipo: TIPOS.find((item) => item === tipo),
    genero: genero || undefined,
    q: q || undefined,
    ordem: ORDENS.find((item) => item === ordem) ?? "relevancia",
  };
}

export function endereco(filtros: FiltrosLidos) {
  const params = new URLSearchParams();
  if (filtros.tipo) params.set("tipo", filtros.tipo);
  if (filtros.q) params.set("q", filtros.q);
  if (filtros.ordem !== "relevancia") params.set("ordem", filtros.ordem);
  if (filtros.genero) params.set("genero", filtros.genero);

  const query = params.toString();
  return query ? `/midias?${query}` : "/midias";
}
