import { CardMidia } from "@/components/card-midia";
import { listarMidias } from "@/lib/api";

/** Quantos títulos a faixa mostra. Seis fecha a grade em 2, 3 e 6 colunas. */
const QUANTOS = 6;

/**
 * A faixa "Em alta" da home.
 *
 * **Componente de servidor assíncrono: ele mesmo busca.** Sem `"use client"`,
 * sem `useEffect`, sem estado de carregamento, sem spinner — o HTML que sai
 * do servidor já vem com os títulos dentro, e a espera é coberta pelo
 * `loading.tsx` da rota, que já existe.
 *
 * A diferença com a versão que busca no navegador não é de estilo. Com
 * `useEffect`: o componente vira client e entra no pacote, uma requisição a
 * mais sai do navegador de cada pessoa, a faixa aparece depois do resto da
 * página (e pula quando chega), e quem indexa a página não vê os títulos.
 *
 * Quando `useEffect` ainda seria a escolha certa: quando o dado depende de
 * algo que só o navegador sabe — o que está no `localStorage`, o tamanho da
 * janela, a posição da rolagem, a permissão de notificação. Nada disso é o
 * caso de uma faixa de catálogo.
 *
 * "Em alta" são os primeiros itens de `GET /midias`: a API já devolve
 * ordenado por popularidade. Reordenar aqui seria inventar um segundo
 * critério para a mesma palavra, e os dois discordariam no primeiro dia.
 */
export async function HomeEmAlta() {
  // A busca passa pelo `lib/api.ts`, como toda busca do projeto: é lá que
  // moram a URL, o tratamento de erro e as etiquetas de cache. E como
  // `listarMidias` está envolvida em `cache()`, esta chamada e a que a página
  // faz são uma ida só à API por renderização.
  const { itens } = await listarMidias();
  const emAlta = itens.slice(0, QUANTOS);

  if (emAlta.length === 0) return null;

  return (
    <section aria-labelledby="em-alta" className="mb-14">
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="em-alta" className="text-xl font-semibold">
          Em alta
        </h2>
        <p className="text-sm text-zinc-500">
          O que mais gente está vendo agora.
        </p>
      </div>

      <ul className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
        {emAlta.map((midia) => (
          <li key={midia.id}>
            <CardMidia midia={midia} />
          </li>
        ))}
      </ul>
    </section>
  );
}
