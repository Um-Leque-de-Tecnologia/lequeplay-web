"use client";

/**
 * `"use client"` porque trocar de aba é estado + evento de usuário, como o
 * "ver mais" da sinopse.
 *
 * O que **não** mudou de lugar: a busca. `midia` chega pronta, por prop, de
 * `app/midias/[slug]/page.tsx`, que é Server Component e já chamou
 * `buscarMidia` no servidor. Nada aqui vai buscar dado — sem `useEffect`,
 * sem `fetch` no navegador, sem estado de "carregando" e sem a ficha piscar
 * vazia antes de aparecer. O HTML sai do servidor com os três painéis
 * dentro; o clique só decide qual deles está visível.
 */

import { useState } from "react";
import { FichaTecnica } from "@/components/ficha-tecnica";
import { elencoDe } from "@/lib/creditos";
import type { Credito, Midia } from "@/lib/tipos";

type IdAba = "sinopse" | "elenco" | "detalhes";

const ABAS: { id: IdAba; rotulo: string }[] = [
  { id: "sinopse", rotulo: "Sinopse" },
  { id: "elenco", rotulo: "Elenco" },
  { id: "detalhes", rotulo: "Detalhes técnicos" },
];

/**
 * Qual aba a ficha abre.
 *
 * Já foi `null`, e `null` significava "nenhuma": a ficha renderizava a barra
 * de abas e painel nenhum, então direção, duração e elenco simplesmente não
 * existiam na tela por mais que se clicasse. Agora abre na primeira — uma
 * ficha sempre mostra alguma coisa.
 *
 * Sai daqui e não da URL de propósito: aba aberta é estado de leitura, não
 * endereço. No dia em que a ficha precisar de link direto para o elenco
 * (`/midias/slug#elenco`), é esta função que passa a ler o fragmento — e só
 * ela.
 */
function abaInicial(): IdAba {
  return ABAS[0].id;
}

/** O elenco sai de `creditos`; a API não manda uma lista de atores solta. */
function Elenco({ creditos }: { creditos: Credito[] | undefined }) {
  const elenco = elencoDe(creditos);

  // `creditos` só vem no detalhe e pode vir sem elenco — dizer isso é melhor
  // do que uma lista vazia, que parece falha de carregamento.
  if (elenco.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        Elenco ainda não cadastrado para este título.
      </p>
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {elenco.map((credito) => (
        <li key={credito.pessoa.slug} className="text-sm">
          <span className="text-zinc-200">{credito.pessoa.nome}</span>
          {/* `personagem` só vem preenchido quando o papel é elenco. */}
          {credito.personagem !== null && (
            <span className="text-zinc-500"> como {credito.personagem}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

function PainelDaAba({ id, midia }: { id: IdAba; midia: Midia }) {
  switch (id) {
    case "sinopse":
      return <p className="max-w-prose text-zinc-300">{midia.sinopse}</p>;
    case "elenco":
      return <Elenco creditos={midia.creditos} />;
    case "detalhes":
      return <FichaTecnica midia={midia} />;
  }
}

export function FichaAbas({ midia }: { midia: Midia }) {
  const [abaAberta, setAbaAberta] = useState<IdAba>(abaInicial);

  return (
    <section aria-labelledby="ficha" className="mt-12">
      <h2 id="ficha" className="sr-only">
        Ficha do título
      </h2>

      {/*
        `role="tablist"` num `<div>` e `<button role="tab">` dentro: os botões
        já são focáveis e anunciáveis por serem `<button>`, e o papel só troca
        como o leitor de tela os agrupa. Nada de `<a href="#">` aqui — não é
        navegação, é troca de painel na mesma página.

        `flex-wrap`: no celular os três rótulos não cabem numa linha, e
        quebrar é melhor do que rolar a barra de lado.
      */}
      <div
        role="tablist"
        aria-label="Ficha do título"
        className="flex flex-wrap gap-1 border-b border-white/10"
      >
        {ABAS.map((aba) => (
          <button
            key={aba.id}
            type="button"
            role="tab"
            id={`aba-${aba.id}`}
            aria-selected={aba.id === abaAberta}
            aria-controls={`painel-${aba.id}`}
            onClick={() => setAbaAberta(aba.id)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition ${
              aba.id === abaAberta
                ? "border-violet-500 text-zinc-100"
                : "border-transparent text-zinc-400 hover:text-zinc-100"
            }`}
          >
            {aba.rotulo}
          </button>
        ))}
      </div>

      {/*
        Os três painéis são renderizados, e o que a aba escolhe é qual deles
        fica visível — mesma decisão do "ver mais" da sinopse. Renderizar só o
        painel aberto pareceria mais econômico e deixaria direção, duração,
        classificação e elenco fora do HTML: quem indexa a página e quem lê
        sem executar JavaScript veriam uma ficha só com a sinopse. São alguns
        bytes contra a ficha inteira existir no documento.

        `hidden` e não `display:none` no CSS: o atributo tira o painel da
        árvore de acessibilidade também, que é o que o padrão de abas pede —
        painel escondido não pode ser lido nem focado por engano.
      */}
      <div className="pt-6">
        {ABAS.map((aba) => (
          <div
            key={aba.id}
            role="tabpanel"
            id={`painel-${aba.id}`}
            aria-labelledby={`aba-${aba.id}`}
            hidden={aba.id !== abaAberta}
            // O painel entra na ordem de tabulação porque o conteúdo dele nem
            // sempre tem elemento focável: sem isto, quem navega por teclado
            // troca de aba e não tem como chegar no que apareceu.
            tabIndex={0}
          >
            <PainelDaAba id={aba.id} midia={midia} />
          </div>
        ))}
      </div>
    </section>
  );
}
