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

/**
 * Atraso de mentira, para medir a UI otimista (LP-506).
 *
 * Na máquina de quem desenvolve, a action responde em poucos milissegundos:
 * o intervalo entre o clique e a resposta é curto demais para enxergar se a
 * tela esperou ou não. Com `ATRASO_ARTIFICIAL_MS=1500` no `.env.local`, a
 * diferença entre "mudou no clique" e "mudou na resposta" fica visível a olho
 * nu — e mensurável.
 *
 * **Nunca em produção**, e não por confiar em quem configura o ambiente: o
 * `NODE_ENV` é conferido aqui dentro. Um atraso esquecido num `.env` de
 * servidor viraria segundo e meio de espera em todo clique de todo mundo.
 */
async function atrasoArtificial(): Promise<void> {
  if (process.env.NODE_ENV === "production") return;

  const ms = Number(process.env.ATRASO_ARTIFICIAL_MS ?? 0);

  if (Number.isFinite(ms) && ms > 0) {
    await new Promise((resolver) => setTimeout(resolver, ms));
  }
}

/**
 * Confere o slug: chega do navegador, então é texto de estranho.
 *
 * Formato **e** existência. Só o formato deixaria o cookie guardar slugs de
 * títulos que não existem, um de cada vez, até o limite de tamanho do cookie.
 */
async function slugConferido(slug: unknown): Promise<string> {
  if (!slugValido(slug)) {
    throw new Error("Slug de mídia inválido");
  }

  if (!(await buscarMidia(slug))) {
    throw new Error("Mídia não encontrada");
  }

  return slug;
}

/**
 * Deixa o título no estado pedido — e não "inverte o que estiver lá".
 *
 * É isto que impede dois cliques rápidos de voltarem no tempo do lado do
 * servidor. Com um "alterna", cada chamada inverteria o que o cookie tem
 * **quando ela chega**: se as duas se cruzarem, o resultado depende da ordem
 * de chegada, e não da ordem dos cliques. Com "fique assistida = false", a
 * operação é idempotente: repetir dá no mesmo, e o último pedido é o que vale.
 */
async function gravarEstado(slug: string, assistida: boolean): Promise<void> {
  await atrasoArtificial();

  const assistidas = await listarAssistidas();
  const jaEsta = assistidas.includes(slug);

  if (assistida && !jaEsta) {
    await gravarAssistidas([...assistidas, slug]);
  } else if (!assistida && jaEsta) {
    await gravarAssistidas(assistidas.filter((item) => item !== slug));
  }
}

/**
 * O caminho **com JavaScript**: chamada direta, de dentro de uma transição,
 * pelo botão otimista da ficha (`components/ficha-marcar-assistida.tsx`).
 *
 * ## Por que não tem `redirect`
 *
 * O `redirect` de Server Action empilha uma entrada no histórico (é `push`
 * por padrão). Aqui, cada clique viraria uma página a mais no "Voltar", e
 * voltar ficaria alternando o botão em vez de sair da ficha. E ele não é
 * preciso: gravar cookie numa Server Action já faz o Next devolver a página
 * renderizada de novo na mesma resposta — é o que fecha a transição com a
 * prop nova, e é quando o valor otimista dá lugar ao do servidor.
 *
 * ## Os parâmetros são conferidos, apesar do tipo
 *
 * `string` e `boolean` são o que o **nosso** botão manda. Quem postar direto
 * no endereço da action manda o que quiser — o tipo do TypeScript não existe
 * em tempo de execução. Por isso o `typeof` abaixo, que o compilador acha
 * redundante e não é.
 */
export async function definirAssistida(
  slug: string,
  assistida: boolean,
): Promise<void> {
  if (typeof assistida !== "boolean") {
    throw new Error("Estado de marcação inválido");
  }

  await gravarEstado(await slugConferido(slug), assistida);
}

/**
 * O caminho **sem JavaScript**: o `<form>` da ficha posta aqui direto.
 *
 * Esse sim termina em `redirect`: sem JS, a resposta do POST é uma página
 * inteira, e sem o redirecionamento um F5 depois do clique perguntaria se a
 * pessoa quer reenviar o formulário. É o padrão POST → redirect → GET.
 */
export async function marcarComoAssistida(formData: FormData): Promise<void> {
  const slug = await slugConferido(formData.get("slug"));
  await gravarEstado(slug, true);
  redirect(`/midias/${slug}`);
}

/** Como `marcarComoAssistida`, para o outro lado. */
export async function desmarcarComoAssistida(
  formData: FormData,
): Promise<void> {
  const slug = await slugConferido(formData.get("slug"));
  await gravarEstado(slug, false);
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
