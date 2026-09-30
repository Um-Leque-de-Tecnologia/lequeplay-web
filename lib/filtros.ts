/**
 * Sanitização e serialização dos parâmetros de busca do catálogo.
 *
 * A URL é a porta de entrada pública do site: qualquer pessoa pode digitar
 * valores inválidos (?tipo=Filme, ?pagina=-3), repetir parâmetros
 * (?tipo=filme&tipo=serie) ou mandar chaves vazias (?q=&genero=).
 *
 * As funções deste módulo garantem que os componentes e a camada de dados
 * trabalhem exclusivamente com valores válidos, tipados e normalizados,
 * sem casts ("as"), sem "any" e sem "!".
 */

export const TIPOS = ["filme", "serie", "podcast"] as const;

export type TipoMidia = (typeof TIPOS)[number];

export type Filtros = {
  tipo?: TipoMidia;
  genero?: string;
  pagina: number;
  q?: string;
};

export type FiltrosBrutos = Record<string, string | string[] | undefined>;

/**
 * Trata o caso de array extraindo o primeiro valor ou devolve o próprio valor.
 */
export function primeiro(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

/**
 * Validação estrita de tipo de mídia sem asserção de tipo ("as").
 */
function ehTipo(valor: string | undefined): valor is TipoMidia {
  return TIPOS.some((t) => t === valor);
}

/**
 * Sanitiza e normaliza os parâmetros brutos lidos da URL.
 *
 * - `tipo`: aceita estritamente valores contidos em TIPOS. Inválidos viram undefined;
 * - `genero`: extrai o primeiro valor não vazio ou undefined;
 * - `pagina`: aceita apenas número inteiro positivo (> 0). Inválidos viram 1;
 * - `q`: termo de busca aparado e não vazio, ou undefined.
 */
export function lerFiltros(bruto: FiltrosBrutos = {}): Filtros {
  const dados = bruto ?? {};
  const tipoBruto = primeiro(dados.tipo);
  const tipo = ehTipo(tipoBruto) ? tipoBruto : undefined;

  const genero = primeiro(dados.genero) || undefined;

  const paginaBruta = Number(primeiro(dados.pagina));
  const pagina =
    Number.isInteger(paginaBruta) && paginaBruta > 0 ? paginaBruta : 1;

  const termoBusca = primeiro(dados.q)?.trim();
  const q = termoBusca ? termoBusca : undefined;

  return {
    tipo,
    genero,
    pagina,
    q,
  };
}

/**
 * Serializa os parâmetros limpos de volta em `URLSearchParams` sem parâmetros vazios.
 *
 * Omite chaves indefinidas, vazias ou com o valor padrão de página (1),
 * mantendo a URL canônica e limpa.
 */
export function endereco(filtros: Partial<Filtros> = {}): URLSearchParams {
  const params = new URLSearchParams();

  if (filtros.tipo) {
    params.set("tipo", filtros.tipo);
  }

  if (filtros.genero) {
    params.set("genero", filtros.genero);
  }

  const q = filtros.q?.trim();
  if (q) {
    params.set("q", q);
  }

  if (filtros.pagina && filtros.pagina > 1) {
    params.set("pagina", String(filtros.pagina));
  }

  return params;
}

