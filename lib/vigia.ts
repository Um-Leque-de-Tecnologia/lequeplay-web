import { revalidateTag } from "next/cache";
import { buscarVersaoDoCatalogo } from "@/lib/api";
import { CACHE_TAGS } from "@/lib/cache-tags";

/**
 * O vigia do catálogo.
 *
 * A API avisa quando mudou: `GET /v1/catalogo/versao` devolve um contador que
 * sobe a cada ingestão. Este módulo é quem escuta — ele lê a versão, compara
 * com a última que viu e **só invalida quando ela mudou**.
 *
 * O "só quando mudou" é o card inteiro. Invalidar a cada verificação, sem
 * comparar, transforma um cache de uma hora num cache do intervalo do
 * verificador: o trabalho de etiquetar tudo (LP-308) e de revalidar sob
 * demanda (LP-309) iria pela janela, e ninguém perceberia — porque continua
 * funcionando, só que caro.
 */

/**
 * A última versão que este processo viu.
 *
 * Mora na memória do módulo, e isso tem uma consequência que precisa estar
 * escrita: **cada instância do servidor tem a sua**. Com três instâncias, a
 * primeira verificação depois de um deploy invalida três vezes em vez de uma.
 *
 * Esse é o erro barato. O caro seria o contrário — um estado compartilhado
 * onde uma instância marca "já invalidei" e as outras servem dado velho
 * achando que alguém cuidou. Se um dia o custo aparecer nos números, o lugar
 * disso é um Redis, não uma variável.
 */
let ultimaVersaoVista: number | null = null;

export type ResultadoDoVigia = {
  /** Se esta verificação encontrou versão diferente da anterior. */
  mudou: boolean;
  /** A versão que a API respondeu agora. */
  versao: number;
  /** A versão anterior, ou `null` na primeira verificação do processo. */
  versaoAnterior: number | null;
};

/**
 * Lê a versão do catálogo e invalida o cache quando ela mudou.
 *
 * Na **primeira** verificação de cada processo não há versão anterior para
 * comparar, e o vigia invalida. É deliberado e barato: logo depois de subir,
 * o cache está frio de qualquer jeito, e a alternativa — assumir que o que
 * está guardado está em dia — é justamente a aposta que deixa dado velho no
 * ar depois de um deploy.
 */
export async function vigiarCatalogo(): Promise<ResultadoDoVigia> {
  const versao = await buscarVersaoDoCatalogo();
  const versaoAnterior = ultimaVersaoVista;

  if (versaoAnterior === versao) {
    return { mudou: false, versao, versaoAnterior };
  }

  ultimaVersaoVista = versao;

  // `expire: 0` para a próxima visita já buscar de novo, e não servir o
  // conteúdo velho enquanto revalida por baixo. É o mesmo argumento do
  // LP-309: quem chama isto é um aviso externo de que o dado mudou.
  revalidateTag(CACHE_TAGS.MIDIAS, { expire: 0 });

  console.info(
    `[vigia] catálogo mudou: ${versaoAnterior ?? "(primeira leitura)"} → ${versao}. Etiqueta "${CACHE_TAGS.MIDIAS}" invalidada.`,
  );

  return { mudou: true, versao, versaoAnterior };
}
