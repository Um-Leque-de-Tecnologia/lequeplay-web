
/**
 * O tamanho máximo do texto da resenha.
 *
 * O contador embaixo do campo e a validação antes de enviar precisam do
 * mesmo número — dois literais iguais em dois arquivos viram, com o tempo,
 * dois números diferentes.
 */
const MAXIMO_DE_CARACTERES = 280;

export function FichaResenha({ titulo }: { titulo: string }) {
  const escritos = 0;

  return (
    <section aria-labelledby="resenha" className="mt-12">
      <h2 id="resenha" className="mb-3 text-xl font-semibold">
        Sua resenha
      </h2>

      <label htmlFor="texto" className="block text-sm text-zinc-400">
        O que você achou de {titulo}?
      </label>

      <textarea
        id="texto"
        name="texto"
        rows={5}
        maxLength={MAXIMO_DE_CARACTERES}
        placeholder="Sem spoiler, por favor."
        className="mt-2 block w-full max-w-prose rounded-md border border-white/15 bg-zinc-900 px-3 py-2 text-base placeholder:text-zinc-600"
      />

      {/* 
        `aria-live="polite"` porque o contador muda enquanto a pessoa digita:
        sem ele, quem usa leitor de tela só descobre que estourou o limite
        quando o campo para de aceitar letra.
      */}
      <p className="mt-1 text-sm text-zinc-500" aria-live="polite">
        {escritos}/{MAXIMO_DE_CARACTERES} caracteres
      </p>

      {/*
        Decisão registrada no LP-511:
        manter o botão desabilitado enquanto a API não disponibilizar
        o endpoint oficial para publicação de resenhas.

        Não habilitar o botão com uma rota inventada evita que a tela
        prometa uma funcionalidade que o contrato atual da API não oferece.

        Quando o endpoint oficial existir, remover esta explicação e
        conectar o botão ao contrato disponibilizado pela API.
      */}
      <button
        type="button"
        disabled
        className="mt-3 rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
      >
        Publicar resenha
      </button>

      <p className="mt-2 text-sm text-zinc-500">
        A publicação de resenhas estará disponível quando a API disponibilizar
        esse recurso.
      </p>
    </section>
  );
}

