import { ImageResponse } from "next/og";

/**
 * A prévia institucional do LequePlay.
 *
 * Mora na raiz de `app/`, e por isso vale para a home **e** para toda rota
 * que não tenha a sua: é ela o "alternativo" que o card pede para os títulos
 * sem pôster.
 *
 * Gerada por código, e não um arquivo commitado, por dois motivos práticos:
 * um PNG de 1200×630 é binário no repositório (que ninguém revisa num diff),
 * e mudar a arte viraria "trocar o arquivo" em vez de mudar duas linhas. De
 * quebra, a convenção declara `og:image:type`, `width` e `height` sozinha —
 * dimensão declarada errada é pior que dimensão ausente, porque o aplicativo
 * recorta contando com um tamanho que não existe.
 */
export const alt = "LequePlay — catálogo de filmes, séries e podcasts";

/** 1200×630 é a proporção que WhatsApp, Facebook e X esperam no cartão grande. */
export const size = { width: 1200, height: 630 };

export const contentType = "image/png";

export default function ImagemDeCompartilhamento() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          backgroundColor: "#09090b",
          color: "#fafafa",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 40,
            color: "#a78bfa",
            letterSpacing: "-0.02em",
          }}
        >
          LequePlay
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 24,
            fontSize: 68,
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
          }}
        >
          Filmes, séries e podcasts num catálogo só
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 28,
            fontSize: 34,
            color: "#a1a1aa",
          }}
        >
          Ache pelo que você está a fim de ver, não pelo título exato.
        </div>
      </div>
    ),
    size,
  );
}
