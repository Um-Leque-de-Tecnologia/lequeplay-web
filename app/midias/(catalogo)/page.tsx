import type { Metadata } from "next";
import { CatalogoBusca } from "@/components/catalogo-busca";
import { CatalogoChipsGenero } from "@/components/catalogo-chips-genero";
import { CatalogoGrade } from "@/components/catalogo-grade";
import { CatalogoVazio } from "@/components/catalogo-vazio";
import { listarGeneros, listarMidias } from "@/lib/api";
import { lerFiltros } from "@/lib/filtros-catalogo";

export const metadata: Metadata = { title: "Catálogo" };

// `searchParams` é uma Promise no Next 16 — precisa de await.
export default async function Catalogo({ searchParams }: PageProps<"/midias">) {
  // O endereço é entrada: `as string` não converte lista nem valor inventado.
  const filtros = lerFiltros(await searchParams);

  // `Promise.all` porque uma busca não depende da outra: em série, a página
  // esperaria a soma dos dois tempos em vez do maior deles.
  const [{ itens }, generos] = await Promise.all([
    listarMidias({
      tipo: filtros.tipo,
      genero: filtros.genero,
      q: filtros.q,
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
      <CatalogoBusca consulta={filtros.q ?? ""} />

      <CatalogoChipsGenero generos={generos} filtros={filtros} />

      <CatalogoGrade
        itens={itens}
        vazio={
          <CatalogoVazio
            q={filtros.q}
            tipo={filtros.tipo}
            genero={filtros.genero}
          />
        }
      />
    </>
  );
}
