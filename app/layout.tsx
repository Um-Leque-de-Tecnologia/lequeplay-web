import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { CabecalhoSite } from "@/components/cabecalho-site";
import { RodapeSite } from "@/components/rodape-site";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  
  // `template` faz cada página virar "Título · LequePlay" sem repetir isto.
  title: { default: "LequePlay", template: "%s · LequePlay" },
  description:
    "Catálogo de filmes, séries e podcasts. Ache pelo que você está a fim de ver, não pelo título exato.",
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
