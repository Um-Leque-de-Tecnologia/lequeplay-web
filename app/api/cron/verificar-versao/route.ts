import { revalidateTag } from "next/cache";
import { obterVersaoCatalogo } from "@/lib/api";
import { CACHE_TAGS } from "@/lib/cache-tags";

let versaoConhecida: number | null = null;

export async function GET() {
  try {
    const { versao: novaVersao } = await obterVersaoCatalogo();

    if (versaoConhecida === novaVersao) {
      return Response.json({
        revalidado: false,
        versao: novaVersao,
      });
    }

    const versaoAnterior = versaoConhecida;
    revalidateTag(CACHE_TAGS.MIDIAS, { expire: 0 });

    console.log(
      `[Cache] Versão alterada de ${versaoConhecida} para ${novaVersao}. Invalidação executada.`,
    );

    versaoConhecida = novaVersao;

    return Response.json({
      revalidado: true,
      versaoAnterior,
      versaoAtual: novaVersao,
    });
  } catch (erro: unknown) {
    console.error("[Cache] Falha ao verificar versão do catálogo:", erro);
    return Response.json(
      { erro: "Falha ao verificar versão do catálogo." },
      { status: 500 },
    );
  }
}

export async function POST() {
  return GET();
}
