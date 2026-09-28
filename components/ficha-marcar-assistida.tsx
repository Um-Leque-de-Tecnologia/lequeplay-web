"use client";

import {
  type MouseEvent,
  useOptimistic,
  useState,
  useTransition,
} from "react";
import {
  definirAssistida,
  desmarcarComoAssistida,
  marcarComoAssistida,
} from "@/app/midias/[slug]/acoes";

/**
 * O botão "Já assisti" da ficha, que muda no clique e não na resposta.
 *
 * ## O problema que ele resolve (LP-506)
 *
 * Com a action do LP-503, marcar leva o tempo da rede: entre o clique e a
 * resposta, a tela não muda nada. Numa conexão ruim parece que o clique não
 * pegou — e quem está usando clica de novo, o que desfaz o que pediu.
 *
 * ## As três peças, e por que cada uma
 *
 * - **`useOptimistic`** dá um valor para desenhar no lugar da prop do
 *   servidor, que só muda quando a resposta chega.
 * - **`useTransition`** é o que sustenta esse valor: o otimista vale
 *   enquanto a transição estiver pendente, e a transição inclui a action e a
 *   página que volta renderizada com o cookie novo. Fora de uma transição, o
 *   `setAssistidaNaTela` é descartado — o React avisa no console.
 * - **Ler `assistidaNaTela`, e não a prop, ao calcular o próximo.** Dois
 *   cliques antes da primeira resposta: a prop ainda diz "não assistida" no
 *   segundo clique. Calcular a partir dela faria o segundo clique marcar de
 *   novo — o que já estava marcado na tela —, e a tela ficaria parada depois
 *   de um clique que deveria desmarcar. É a partir do que a pessoa está vendo
 *   que ela decide o próximo clique; é a partir disso que o próximo valor sai.
 *
 * ## Por que o valor otimista é o alvo, e não "o contrário do atual"
 *
 * `setAssistidaNaTela(proxima)`, com o valor explícito, e não um redutor
 * `(atual) => !atual`. Quando a primeira resposta chega com o segundo clique
 * ainda pendente, o React reaplica as atualizações otimistas pendentes em
 * cima da prop nova. Um "inverte" reaplicado em cima de uma base que já
 * mudou produz o valor errado; um "fique `false`" reaplicado produz `false`.
 * A action do servidor segue a mesma regra, pelo mesmo motivo.
 *
 * ## Funciona sem JavaScript
 *
 * O `<form>` com a action do LP-503 continua aqui. Sem JS, o botão é um
 * submit comum: o navegador posta, o servidor grava e redireciona. Com JS, o
 * clique chama `preventDefault` e roda a transição — o formulário nunca chega
 * a ser enviado.
 */
export function FichaMarcarAssistida({
  slug,
  assistida,
}: {
  slug: string;
  /** O que o cookie dizia quando a página foi renderizada no servidor. */
  assistida: boolean;
}) {
  const [assistidaNaTela, setAssistidaNaTela] = useOptimistic(assistida);
  const [, startTransition] = useTransition();
  const [falhou, setFalhou] = useState(false);

  function alternar(evento: MouseEvent<HTMLButtonElement>) {
    // Com JS, quem envia é a transição abaixo — o submit nativo sairia em
    // paralelo e gravaria duas vezes.
    evento.preventDefault();

    // Do que está na tela, não da prop: ver o comentário do componente.
    const proxima = !assistidaNaTela;

    // Fora da transição de propósito: dentro dela, `useState` só aplica
    // quando a transição termina, e o aviso de erro antigo ficaria na tela
    // durante o clique seguinte.
    setFalhou(false);

    startTransition(async () => {
      // No quadro do clique. É esta linha que faz o botão mudar sem esperar.
      setAssistidaNaTela(proxima);

      try {
        await definirAssistida(slug, proxima);
      } catch {
        /*
          Não é preciso desfazer nada à mão: quando a transição termina, o
          otimista cede à prop — e a prop continua sendo o que o servidor tem,
          porque nada foi gravado. O botão volta sozinho para o estado real.

          O `catch` existe para o erro não subir para o `error.tsx`, que
          trocaria a ficha inteira por uma tela de erro por causa de um botão.
          No lugar disso, uma frase ao lado dele.
        */
        setFalhou(true);
      }
    });
  }

  return (
    <form
      // O caminho sem JS decide pelo estado do servidor, que é o único que
      // existe quando o HTML é tudo o que o navegador tem.
      action={assistida ? desmarcarComoAssistida : marcarComoAssistida}
      className="mt-6"
    >
      <input type="hidden" name="slug" value={slug} />

      {/*
        Um botão só, que troca de rótulo — e não dois formulários, um para
        cada estado, como no LP-503. Com dois, o elemento focado deixava de
        existir a cada clique e o foco do teclado caía para o começo da
        página. Com um, o foco fica onde a pessoa estava, e o leitor de tela
        anuncia o rótulo novo.

        Não é desabilitado durante o envio: o segundo clique antes da
        resposta é justamente o caso que este componente trata.
      */}
      <button
        type="submit"
        onClick={alternar}
        className={
          assistidaNaTela
            ? "rounded-md border border-white/15 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-violet-500 hover:text-white"
            : "rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-500"
        }
      >
        {assistidaNaTela ? "Desmarcar como já assistido" : "Já assisti"}
      </button>

      {falhou && (
        <p role="alert" className="mt-2 text-sm text-red-300">
          Não conseguimos salvar a marcação. Tente de novo.
        </p>
      )}
    </form>
  );
}
