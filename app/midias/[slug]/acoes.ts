"use server";

import { buscarMidia } from "@/lib/api";
import {
  gravarAssistidas,
  listarAssistidas,
  slugValido,
} from "@/lib/assistidas";

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

/*
 * Sem `redirect` no fim das actions. Gravar ou apagar cookie numa Server
 * Action já faz o Next redesenhar a rota na resposta do mesmo POST (doc de
 * `cookies`, "Understanding Cookie Behavior in Server Functions"), e a URL
 * fica como estava — com o `?temporada=&episodio=` do "Retomar", ou o
 * `?episodios=todos` do podcast. Um `redirect` para `/midias/${slug}` jogava
 * isso fora.
 *
 * Por isso a gravação é incondicional: é ela que dispara o redesenho. Se
 * marcar pulasse a escrita quando o título já está na lista, uma segunda aba
 * aberta na mesma ficha continuaria mostrando o botão velho depois do clique.
 * Com o botão otimista (LP-506) é pior: sem redesenho, a transição termina,
 * o otimista cede à prop velha, e o botão desfaz o clique sozinho.
 */

/**
 * Deixa o título no estado pedido — e não "inverte o que estiver lá".
 *
 * Com o valor explícito, repetir o pedido dá no mesmo: o clique numa segunda
 * aba que ainda mostra o estado velho, ou o F5 que reenvia o formulário sem
 * JavaScript, deixa o cookie onde a pessoa pediu. Um "alterna" desfaria.
 */
async function gravarEstado(slug: string, assistida: boolean): Promise<void> {
  await atrasoArtificial();

  const assistidas = await listarAssistidas();

  if (assistida) {
    await gravarAssistidas(
      assistidas.includes(slug) ? assistidas : [...assistidas, slug],
    );
    return;
  }

  await gravarAssistidas(assistidas.filter((item) => item !== slug));
}

/**
 * O caminho **com JavaScript**: chamada direta, de dentro de uma transição,
 * pelo botão otimista da ficha (`components/ficha-marcar-assistida.tsx`).
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

/** O caminho **sem JavaScript**: o `<form>` da ficha posta aqui direto. */
export async function marcarComoAssistida(formData: FormData): Promise<void> {
  await gravarEstado(await slugConferido(formData.get("slug")), true);
}

/** Como `marcarComoAssistida`, para o outro lado. */
export async function desmarcarComoAssistida(
  formData: FormData,
): Promise<void> {
  await gravarEstado(await slugConferido(formData.get("slug")), false);
}
