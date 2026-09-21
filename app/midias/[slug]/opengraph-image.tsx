import { ImageResponse } from "next/og";
import { buscarMidia } from "@/lib/api";

/**
 * A prévia de uma ficha: o cartão que aparece quando alguém cola o link do
 * título numa conversa.
 *
 * Gerada por código em vez de apontar para o pôster direto, e o motivo é o
 * formato: o pôster do acervo de desenvolvimento é **SVG**, e WhatsApp,
 * Facebook e X não renderizam SVG em `og:image` — o cartão sairia sem imagem
 * nenhuma, que é justamente o que o card quer evitar. Aqui o pôster entra
 * dentro de uma imagem PNG de 1200×630, junto do título.
 *
 * Quando o pôster não existe — ou quando é um formato que o gerador não sabe
 * embutir —, o cartão continua de pé só com a tipografia. É o "alternativo do
 * LequePlay" do card, e não uma imagem quebrada.
 */
export const alt = "Prévia do título no LequePlay";

export const size = { width: 1200, height: 630 };

export const contentType = "image/png";

const ROTULO_TIPO = {
  filme: "Filme",
  serie: "Série",
  podcast: "Podcast",
} as const;

export default async function ImagemDaFicha({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const midia = await buscarMidia(slug);

  const titulo = midia?.titulo ?? "LequePlay";
  const linha = midia
    ? `${ROTULO_TIPO[midia.tipo]} · ${midia.ano}`
    : "Catálogo de filmes, séries e podcasts";

  /**
   * Só embute o pôster quando ele é uma imagem remota em formato de bitmap.
   * O gerador não rasteriza SVG, e o acervo de desenvolvimento é todo SVG —
   * então, no mock, o cartão sai tipográfico, e com a API real (que serve
   * JPEG da TMDB) ele sai com a capa.
   */
  const poster =
    midia?.posterUrl && /^https?:\/\/.+\.(jpe?g|png|webp)$/i.test(midia.posterUrl)
      ? midia.posterUrl
      : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: "56px",
          padding: "72px",
          backgroundColor: "#09090b",
          color: "#fafafa",
        }}
      >
        {poster && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={poster}
            alt=""
            width={324}
            height={486}
            style={{ borderRadius: 16, objectFit: "cover" }}
          />
        )}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            flex: 1,
          }}
        >
          <div style={{ display: "flex", fontSize: 32, color: "#a78bfa" }}>
            LequePlay
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 20,
              fontSize: poster ? 60 : 72,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
            }}
          >
            {titulo}
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 24,
              fontSize: 32,
              color: "#a1a1aa",
            }}
          >
            {linha}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
