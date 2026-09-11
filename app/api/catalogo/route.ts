import type { Midia, MidiaCard, Pagina } from "@/lib/tipos";

/**
 * BFF (Backend-For-Frontend) do Catálogo.
 *
 * Faz a ponte segura entre o cliente e a API externa:
 * 1. Executa exclusivamente no servidor Next.js, mantendo a `API_KEY` protegida;
 * 2. Limita o tempo de espera com `signal: AbortSignal.timeout(5000)`;
 * 3. Filtra e devolve estritamente os campos necessários aos cartões de mídia,
 *    evitando trafegar dados pesados (sinopses completas, episódios, créditos).
 */

function mapearParaCard(midia: Midia): MidiaCard {
  const card: MidiaCard = {
    id: midia.id,
    slug: midia.slug,
    titulo: midia.titulo,
    tipo: midia.tipo,
    ano: midia.ano,
    notaMedia: midia.notaMedia,
    totalAvaliacoes: midia.totalAvaliacoes,
  };

  if (midia.posterUrl !== undefined) {
    card.posterUrl = midia.posterUrl;
  }

  return card;
}

export async function GET(request: Request): Promise<Response> {
  const apiKey = process.env.API_KEY;
  const baseUrl = process.env.API_URL ?? "http://localhost:8080";

  const urlDestino = new URL(
    baseUrl.endsWith("/") ? `${baseUrl}midias` : `${baseUrl}/midias`,
  );

  const requestUrl = new URL(request.url);
  requestUrl.searchParams.forEach((valor, chave) => {
    urlDestino.searchParams.set(chave, valor);
  });

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
    headers["x-api-key"] = apiKey;
  }

  try {
    const resposta = await fetch(urlDestino.toString(), {
      headers,
      signal: AbortSignal.timeout(5000),
    });

    if (!resposta.ok) {
      return Response.json(
        { erro: `A API externa respondeu com status ${resposta.status}` },
        { status: resposta.status },
      );
    }

    const dados = (await resposta.json()) as Partial<Pagina<Midia>>;
    const itensBrutos = dados.itens ?? [];
    const itens = itensBrutos.map(mapearParaCard);

    const paginaMapeada: Pagina<MidiaCard> = {
      itens,
      pagina: dados.pagina ?? 1,
      porPagina: dados.porPagina ?? itens.length,
      total: dados.total ?? itens.length,
    };

    return Response.json(paginaMapeada);
  } catch (erro) {
    if (erro instanceof Error && erro.name === "TimeoutError") {
      return Response.json(
        { erro: "Tempo limite esgotado ao buscar o catálogo." },
        { status: 504 },
      );
    }

    // Fallback gracioso para ambiente de desenvolvimento com mock ativo
    if (process.env.USAR_MOCK !== "false") {
      const { default: midiasMock } = await import("@/data/midias.json");
      const todas = midiasMock as Midia[];

      const tipo = requestUrl.searchParams.get("tipo");
      const genero = requestUrl.searchParams.get("genero");
      const q = requestUrl.searchParams.get("q")?.trim().toLowerCase();

      const filtradas = todas.filter(
        (m) =>
          (!tipo || m.tipo === tipo) &&
          (!genero || m.generos.some((g) => g === genero)) &&
          (!q || m.titulo.toLowerCase().includes(q)),
      );

      const itens = filtradas.map(mapearParaCard);

      const paginaMapeada: Pagina<MidiaCard> = {
        itens,
        pagina: 1,
        porPagina: itens.length,
        total: itens.length,
      };

      return Response.json(paginaMapeada);
    }

    return Response.json(
      { erro: "Erro de comunicação ao consultar a API externa." },
      { status: 502 },
    );
  }
}
