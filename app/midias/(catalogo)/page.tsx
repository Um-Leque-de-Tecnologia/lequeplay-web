import type { Metadata } from "next";
import { CatalogoBusca } from "@/components/catalogo-busca";
import { CatalogoChipsGenero } from "@/components/catalogo-chips-genero";
import { CatalogoGrade } from "@/components/catalogo-grade";
import { CatalogoVazio } from "@/components/catalogo-vazio";
import { listarGeneros, listarMidias } from "@/lib/api";
import type { Midia } from "@/lib/tipos";

export const metadata: Metadata = { title: "Catálogo" };

// `searchParams` é uma Promise no Next 16 — precisa de await.
export default async function Catalogo({ searchParams }: PageProps<"/midias">) {
  const { tipo, q } = await searchParams;

  // `Promise.all` porque uma busca não depende da outra: em série, a página
  // esperaria a soma dos dois tempos em vez do maior deles.
  const [{ itens, pagina, total }, generos] = await Promise.all([
    listarMidias({
      tipo: typeof tipo === "string" ? (tipo as Midia["tipo"]) : undefined,
      q: typeof q === "string" ? q : undefined,
    }),
    listarGeneros(),
  ]);

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        Catálogo
      </h1>

      {/*
        A busca ainda não funciona de verdade: hoje ela só filtra por título
        exato, no cliente da API. Fazer ela entender intenção é o ticket da
        sprint 6.
      */}
      <CatalogoBusca consulta={typeof q === "string" ? q : ""} />

      <CatalogoChipsGenero generos={generos} />

      <CatalogoGrade
        itens={itens}
        // `total` é o tamanho do resultado inteiro, não da página: é a
        // única forma de a grade saber se tem tudo para poder ordenar.
        resultadoCompleto={pagina === 1 && itens.length >= total}
        vazio={
          <CatalogoVazio
            q={typeof q === "string" ? q : undefined}
            tipo={typeof tipo === "string" ? tipo : undefined}
          />
        }
      />
    </>
  );
}
