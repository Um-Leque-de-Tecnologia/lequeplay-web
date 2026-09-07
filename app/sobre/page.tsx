import type { Metadata } from "next";
import Link from "next/link";
import { SobrePerguntasFrequentes } from "@/components/sobre-perguntas-frequentes";

export const metadata: Metadata = {
  title: "Sobre",
  description:
    "O que é o LequePlay, de onde vem o acervo e o que ainda está por vir.",
};

export default function Sobre() {
  return (
    <article>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        Sobre o LequePlay  
      </h1>

      <p className="mt-4 max-w-prose text-zinc-300">
        O LequePlay é um catálogo de filmes, séries e podcasts no mesmo lugar.
        A ideia é simples: quase todo mundo sabe procurar quando já sabe o
        nome do que quer. O difícil é a outra hora — a de sentar no sofá sem
        ideia nenhuma e querer alguma coisa leve, curta, que combine com a
        terça-feira.
      </p>

      <p className="mt-4 max-w-prose text-zinc-300">
        Ele não é dono dos dados e não exibe nada: o acervo vem de uma API
        própria, e quem toca o play é o serviço onde o título está. Aqui a
        gente cuida do que você vê — a ficha, a busca e, mais para frente, o
        registro do que você já assistiu.
      </p>

      <section aria-labelledby="o-que-vem" className="mt-12">
        <h2 id="o-que-vem" className="text-xl font-semibold">
          O que ainda vem
        </h2>
        <p className="mt-3 max-w-prose text-zinc-400">
          Hoje o LequePlay é só o catálogo: você navega e olha. Falta o que
          faz uma pessoa voltar — diário do que assistiu, resenhas, listas
          próprias e um jeito de acompanhar gente com gosto parecido com o
          seu.
        </p>
      </section>

      <section aria-labelledby="perguntas" className="mt-12">
        <h2 id="perguntas" className="text-xl font-semibold">
          Perguntas frequentes
        </h2>
        <SobrePerguntasFrequentes />
      </section>

      <p className="mt-12 text-sm text-zinc-500">
        Quer começar pelo acervo?{" "}
        <Link href="/midias" className="text-violet-400 hover:text-violet-300">
          Ver o catálogo
        </Link>
        .
      </p>
    </article>
  );
}
