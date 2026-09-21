import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { CabecalhoSite } from "@/components/cabecalho-site";
import { RodapeSite } from "@/components/rodape-site";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const DESCRICAO =
  "Catálogo de filmes, séries e podcasts. Ache pelo que você está a fim de ver, não pelo título exato.";

/**
 * O endereço público do site.
 *
 * Vem da variável de ambiente, e não do código: com `localhost` chumbado,
 * todo link compartilhado de produção apontaria para a máquina de quem
 * compartilhou. O fallback é o de desenvolvimento, que é onde `NEXT_PUBLIC_SITE_URL`
 * costuma faltar — em produção, faltar é erro de configuração, e é melhor ele
 * aparecer numa prévia quebrada do que virar um link para a máquina de alguém.
 */
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  /**
   * É o `metadataBase` que transforma caminho relativo em URL absoluta em
   * toda a árvore de rotas. Sem ele, `og:image` e `og:url` saem relativos — e
   * relativo não funciona fora do site, que é exatamente onde a prévia é
   * lida: no WhatsApp, no navegador de outra pessoa, num post.
   */
  metadataBase: new URL(SITE),

  // `template` faz cada página virar "Título · LequePlay" sem repetir isto.
  title: { default: "LequePlay", template: "%s · LequePlay" },
  description: DESCRICAO,

  /**
   * A prévia padrão do site. Cada ficha sobrescreve título e descrição na sua
   * `generateMetadata`; a imagem vem da convenção `opengraph-image`, que o
   * Next aplica ao segmento e a tudo abaixo dele — e já declara tipo, largura
   * e altura sozinha.
   */
  openGraph: {
    type: "website",
    siteName: "LequePlay",
    locale: "pt_BR",
    title: "LequePlay",
    description: DESCRICAO,
    url: "/",
  },

  twitter: {
    card: "summary_large_image",
    title: "LequePlay",
    description: DESCRICAO,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body className="bg-zinc-950 text-zinc-100">
        {/* Primeiro elemento focável: pula o cabeçalho inteiro. */}
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-violet-600 focus:px-4 focus:py-2 focus:font-medium focus:text-white"
        >
          Pular para o conteúdo
        </a>

        <div className="grid min-h-dvh grid-rows-[auto_1fr_auto]">
          <CabecalhoSite />

          <main id="conteudo" className="mx-auto w-full max-w-6xl px-6 py-10">
            {children}
          </main>

          <RodapeSite />
        </div>
      </body>
    </html>
  );
}
