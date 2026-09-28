"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import {
  ErroDaApi,
  buscarMidia,
  publicarResenha as publicarResenhaNaApi,
} from "@/lib/api";
import {
  gravarAssistidas,
  listarAssistidas,
  slugValido,
} from "@/lib/assistidas";
import { tagMidia } from "@/lib/cache-tags";
import { buscarUsuarioLogado } from "@/lib/dal";
import { RESENHA_PUBLICAVEL } from "@/lib/recursos";
import { lerTokenDeAcesso } from "@/lib/sessao";
import { LIMITE_TEXTO_RESENHA } from "@/lib/tipos";

/* -------------------------------------------------------------------------
   Marcar como assistida (LP-503)
   ------------------------------------------------------------------------- */

async function slugDoFormulario(formData: FormData): Promise<string> {
  const slug = formData.get("slug");

  if (!slugValido(slug)) {
    throw new Error("Slug de mídia inválido");
  }

  if (!(await buscarMidia(slug))) {
    throw new Error("Mídia não encontrada");
  }

  return slug;
}

export async function marcarComoAssistida(formData: FormData): Promise<void> {
  const slug = await slugDoFormulario(formData);
  const assistidas = await listarAssistidas();

  if (!assistidas.includes(slug)) {
    await gravarAssistidas([...assistidas, slug]);
  }

  redirect(`/midias/${slug}`);
}

export async function desmarcarComoAssistida(
  formData: FormData,
): Promise<void> {
  const slug = await slugDoFormulario(formData);
  const assistidas = await listarAssistidas();

  await gravarAssistidas(assistidas.filter((item) => item !== slug));
  redirect(`/midias/${slug}`);
}

/* -------------------------------------------------------------------------
   Publicar resenha (LP-504)
   ------------------------------------------------------------------------- */

/**
 * O que a ficha sabe depois de uma tentativa de publicar.
 *
 * Devolve **só o que a tela mostra** (a regra de
 * `docs/server-actions-seguranca.md`): a mensagem, e o texto de volta quando
 * deu errado, para a pessoa não perder o que escreveu. A resenha salva não
 * volta por aqui — quem a mostra é a própria ficha, renderizada de novo, e é
 * disso que trata o comentário do `updateTag` lá embaixo.
 */
export type EstadoDaResenha = {
  erro?: string;
  publicada?: boolean;
  /** O que foi digitado, devolvido só em caso de erro. */
  texto?: string;
};

/** A nota vai de 0 a 10, inteira — é o que a API valida do lado dela. */
const NOTA_MINIMA = 0;
const NOTA_MAXIMA = 10;

/**
 * Publica a resenha de quem está logado e faz a tela mostrar o resultado sem
 * ninguém apertar F5.
 *
 * ## O ponto desta action é a última linha
 *
 * Sem invalidar nada, isto seria o bug clássico da primeira action: o clique
 * funciona, a API grava, a action devolve o valor novo — e a ficha continua
 * exibindo o estado anterior, porque o que está na tela veio do cache. Só um
 * recarregamento na mão corrigiria.
 *
 * A escolha da ferramenta importa, e as três não são intercambiáveis:
 *
 * - **`updateTag`** — expira a etiqueta **na hora** e avisa o cliente para
 *   jogar fora o cache de roteador dele. É a que serve aqui.
 * - **`revalidateTag(tag, perfil)`** — entra no caminho *stale-while-*
 *   *revalidate*: a próxima visita ainda recebe o conteúdo velho enquanto a
 *   revalidação corre por baixo. É o que a rota `/api/revalidar` usa com
 *   `{ expire: 0 }`, onde quem avisa é uma ingestão e ninguém está olhando a
 *   tela naquele instante. Aqui, alguém acabou de clicar e está olhando.
 * - **`revalidatePath("/", "layout")`** — resolveria também, derrubando o
 *   catálogo etiquetado inteiro a cada resenha publicada. Conserta a tela
 *   destruindo o trabalho de cache do LP-308/309/310. Não.
 *
 * ## O que fica de fora da invalidação, de propósito
 *
 * A resenha com nota mexe na média do título, e a média aparece também nos
 * cartões do catálogo, que vivem sob a etiqueta `midias`. Derrubar `midias`
 * a cada resenha seria limpar o catálogo inteiro por causa de uma linha: a
 * ficha, que é onde a pessoa está olhando, sai correta na hora; o cartão na
 * grade acerta a média na próxima revalidação (uma hora) ou quando o vigia
 * passar. É a troca barata — e está escrita aqui para ser uma decisão, e não
 * um esquecimento que alguém descobre depois.
 */
export async function publicarResenha(
  _estadoAnterior: EstadoDaResenha,
  dados: FormData,
): Promise<EstadoDaResenha> {
  const texto = String(dados.get("texto") ?? "").trim();
  const slugRecebido = String(dados.get("slug") ?? "").trim();
  const notaRecebida = String(dados.get("nota") ?? "").trim();
  // Checkbox não marcada não chega no `FormData` — ausência é `false`, e não
  // "não sei".
  const contemSpoiler = dados.get("contemSpoiler") !== null;

  // A porta fechada vem primeiro, e vale mesmo para quem postar direto aqui
  // sem passar pela tela: com o endpoint fora do ar, a chamada viraria um 404
  // e a pessoa levaria a culpa de um erro que não é dela.
  if (!RESENHA_PUBLICAVEL) {
    return {
      erro: "Publicar resenha ainda não existe na API. O que você escreveu não foi salvo.",
      texto,
    };
  }

  /*
    A sessão é conferida DENTRO da action, e não pelo fato de o formulário só
    aparecer para quem entrou. A doc do Next é explícita, e o
    `docs/server-actions-seguranca.md` a cita: "Render-time gating (only
    rendering a form on an authenticated page) is not a security boundary,
    because requests can be sent without going through the UI."

    Quem responde "quem está logado?" é a DAL, que pergunta ao `/v1/auth/me`.
    Ter o cookie não é estar logado.
  */
  const usuario = await buscarUsuarioLogado();

  if (!usuario) {
    return { erro: "Sua sessão expirou. Entre de novo para publicar.", texto };
  }

  /*
    O slug chega de um campo escondido, ou seja: é texto de estranho, como o
    `de` do login (LP-407). Duas coisas dependem dele, e as duas são caras se
    ele não for conferido — a URL para onde a escrita vai, e a etiqueta de
    cache que será derrubada no fim. Um slug inventado aqui viraria
    `updateTag("midia:qualquer-coisa")`, que é invalidação de cache comandada
    de fora.

    A conferência não é de formato, é de existência: `buscarMidia` pergunta ao
    catálogo. Só um título que existe passa daqui.
  */
  const midia = await buscarMidia(slugRecebido);

  if (!midia) {
    return { erro: "Esse título não existe no catálogo.", texto };
  }

  if (texto.length < LIMITE_TEXTO_RESENHA.minimo) {
    return {
      erro: `Escreva pelo menos ${LIMITE_TEXTO_RESENHA.minimo} caracteres.`,
      texto,
    };
  }

  if (texto.length > LIMITE_TEXTO_RESENHA.maximo) {
    return {
      erro: `O texto passa do limite de ${LIMITE_TEXTO_RESENHA.maximo} caracteres.`,
      texto,
    };
  }

  /*
    Nota é opcional: dá para resenhar sem dar nota, e o contrato aceita.
    Campo vazio vira `null`, que é diferente de zero — `0` é "detestei", e
    `null` é "não quis dar nota". A validação existe porque `Number("")` é
    `0`, e sem ela o campo em branco viraria a pior nota possível.
  */
  let nota: number | null = null;

  if (notaRecebida !== "") {
    const numero = Number(notaRecebida);

    if (
      !Number.isInteger(numero) ||
      numero < NOTA_MINIMA ||
      numero > NOTA_MAXIMA
    ) {
      return {
        erro: `A nota vai de ${NOTA_MINIMA} a ${NOTA_MAXIMA}, em número inteiro.`,
        texto,
      };
    }

    nota = numero;
  }

  // O token sai do cookie aqui dentro, nunca de um parâmetro da action: ele é
  // `httpOnly` justamente para o JavaScript da página não o enxergar (LP-403).
  const tokenDeAcesso = await lerTokenDeAcesso();

  if (!tokenDeAcesso) {
    return { erro: "Sua sessão expirou. Entre de novo para publicar.", texto };
  }

  try {
    await publicarResenhaNaApi(
      midia.slug,
      { nota, texto, contemSpoiler },
      tokenDeAcesso,
    );
  } catch (erro) {
    if (erro instanceof ErroDaApi && erro.status === 401) {
      return { erro: "Sua sessão expirou. Entre de novo para publicar.", texto };
    }

    if (erro instanceof ErroDaApi && erro.status === 400) {
      // A API valida de novo, e pode recusar por motivo que o front não
      // conhece. O `detail` dela não chega à tela de propósito — o
      // `lib/api.ts` só deixa passar o status.
      return { erro: "A API recusou esta resenha. Revise o texto e a nota.", texto };
    }

    return {
      erro: "Não conseguimos falar com o servidor agora. Tente de novo em instantes.",
      texto,
    };
  }

  /*
    Aqui a tela deixa de mentir.

    `updateTag` só roda em Server Action (fora dela, lança), expira a etiqueta
    imediatamente — sem a janela de conteúdo velho do *stale-while-revalidate*
    — e marca a resposta com `ActionDidRevalidateStaticAndDynamic`, que é o
    que manda o roteador do cliente descartar o que ele tinha guardado. A
    ficha volta do servidor já com a resenha dentro, na mesma ida.

    A etiqueta é a do título, `midia:<slug>`, e não a do catálogo: cirúrgica,
    como `lib/cache-tags.ts` descreve.
  */
  updateTag(tagMidia(midia.slug));

  // Sem `redirect`: a pessoa continua na ficha que estava lendo. Mandá-la
  // para outro lugar depois de escrever seria perder o lugar dela na página
  // para resolver um problema de cache que o `updateTag` já resolveu.
  return { publicada: true };
}
