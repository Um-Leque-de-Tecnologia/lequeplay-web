import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FichaAbas } from "@/components/ficha-abas";
import { FichaCompartilhar } from "@/components/ficha-compartilhar";
import { FichaResenha } from "@/components/ficha-resenha";
import { FichaSinopse } from "@/components/ficha-sinopse";
import { FichaTemporadas } from "@/components/ficha-temporadas";
import { buscarMidia } from "@/lib/api";

export async function generateMetadata({
  params,
}: PageProps<"/midias/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const midia = await buscarMidia(slug);

  if (!midia) return { title: "Título não encontrado" };

  // Define a imagem: usa o pôster se houver, senão usa a alternativa do LequePlay
  const imagemCapa = midia.posterUrl ?? "/capas/sem-capa.svg";

  return {
    title: midia.titulo,
    description: midia.sinopse,
    openGraph: {
      title: midia.titulo,
      description: midia.sinopse,
      url: `/midias/${midia.slug}`,
      siteName: "LequePlay",
      images: [
        {
          url: imagemCapa,
          width: 300,
          height: 450,
          alt: `Pôster do título ${midia.titulo}`,
        },
      ],
      locale: "pt_BR",
      type: "article",
    },
  };
}
export default async function PaginaDaMidia({
  params,
}: PageProps<"/midias/[slug]">) {
  const { slug } = await params;
  const midia = await buscarMidia(slug);

  // `buscarMidia` devolve `Midia | null`, então o TypeScript obriga a tratar
  // o caso "não achei" — que na tela vira o 404.
  if (!midia) notFound();

  return (
    <article>
      <nav aria-label="Trilha" className="mb-6 text-sm">
        <Link href="/midias" className="text-zinc-400 hover:text-zinc-100">
          ← Voltar ao catálogo
        </Link>
      </nav>

      <div className="grid gap-8 sm:grid-cols-[240px_1fr]">
        <Image
          // Mesma regra do card: `posterUrl` vem ausente, não `null`, e o `??`
          // cobre os dois. Ver o comentário em components/card-midia.tsx.
          src={midia.posterUrl ?? "/capas/sem-capa.svg"}
          alt=""
          width={300}
          height={450}
          className="w-full rounded-lg border border-white/10"
          priority
        />

        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {midia.titulo}
          </h1>

          {/*
            `totalAvaliacoes === 0` e não `notaMedia === null`: a nota agora é
            sempre número, e sozinha ela não distingue "ninguém avaliou" de
            "todo mundo detestou". O contador distingue.
          */}
          <p className="mt-2 text-sm text-zinc-500">
            {midia.totalAvaliacoes === 0
              ? "Ainda sem avaliações"
              : `★ ${midia.notaMedia.toFixed(1)} · ${midia.totalAvaliacoes} avaliações`}
          </p>

          {/*
            A sinopse aparece duas vezes na página, e é de propósito: aqui em
            cima cortada, para quem só passou o olho, e inteira na aba
            "Sinopse", para quem desceu atrás do texto completo. É o mesmo
            campo vindo da mesma chamada — a duplicação é de apresentação,
            não de dado.
          */}
          <FichaSinopse midia={midia} />
        </div>
      </div>

      <FichaAbas midia={midia} />

      {/* O narrowing por `tipo` é o que garante que `temporadas` existe. */}
      {midia.tipo === "serie" && <FichaTemporadas serie={midia} />}

      <FichaResenha titulo={midia.titulo} />

      <FichaCompartilhar slug={midia.slug} titulo={midia.titulo} />
    </article>
  );
}
