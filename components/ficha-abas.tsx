"use client";

import { useRef, useSyncExternalStore } from "react";

import { FichaTecnica } from "@/components/ficha-tecnica";
import type { Credito, Midia } from "@/lib/tipos";

type IdAba = "sinopse" | "elenco" | "detalhes";

const ABAS: { id: IdAba; rotulo: string }[] = [
  { id: "sinopse", rotulo: "Sinopse" },
  { id: "elenco", rotulo: "Elenco" },
  { id: "detalhes", rotulo: "Detalhes técnicos" },
];

/**
 * Qual aba está aberta: a do fragmento da URL (`/midias/slug#elenco`), e a
 * sinopse quando não há fragmento ou ele não é de aba nenhuma.
 *
 * A aba mora na URL, e não num `useState`, para o link de uma aba abrir nela
 * e o "voltar" desfazer a troca (LP-501). É a única função que lê o
 * fragmento, e o `useSyncExternalStore` só a chama no navegador.
 */
function abaDoFragmento(): IdAba {
  const fragmento = window.location.hash.slice(1);
  return ABAS.find((aba) => aba.id === fragmento)?.id ?? "sinopse";
}

/**
 * O fragmento nunca chega ao servidor: ele renderiza a sinopse, e a
 * hidratação usa este mesmo valor. Logo depois o React relê
 * `abaDoFragmento` e troca de aba, se for o caso — sem erro de hidratação.
 */
function abaNoServidor(): IdAba {
  return "sinopse";
}

/**
 * Quem precisa saber que a aba mudou. Voltar e avançar disparam `hashchange`
 * sozinhos; o `pushState` da própria ficha não dispara evento nenhum, e por
 * isso `irParaAba` avisa por aqui.
 */
const avisosDeAba = new Set<() => void>();

function assinarAba(avisar: () => void) {
  avisosDeAba.add(avisar);
  window.addEventListener("hashchange", avisar);

  return () => {
    avisosDeAba.delete(avisar);
    window.removeEventListener("hashchange", avisar);
  };
}

function irParaAba(id: IdAba) {
  // `pushState`, e não `location.hash =`: é o caminho que o Next acompanha,
  // e cada troca vira uma entrada no histórico, que o "voltar" percorre.
  window.history.pushState(null, "", `#${id}`);
  avisosDeAba.forEach((avisar) => avisar());
}

/** O elenco sai de `creditos`; a API não manda uma lista de atores solta. */
// `null` também: `GET /v1/midias/tagesschau` responde `"creditos": null` (LP-212).
function Elenco({ creditos }: { creditos: Credito[] | null | undefined }) {
  const elenco = creditos?.filter((c) => c.papel === "elenco") ?? [];

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
          {/* `personagem` só vem quando o papel é elenco — e, quando não vem,
              a chave nem existe: comparar com `null` deixaria passar o
              `undefined` e escreveria "como" sem ninguém depois. */}
          {credito.personagem && (
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
      return (
        <p className="max-w-prose text-zinc-300">
          {midia.sinopse ?? "Este título ainda não tem sinopse."}
        </p>
      );
    case "elenco":
      return <Elenco creditos={midia.creditos} />;
    case "detalhes":
      return <FichaTecnica midia={midia} />;
  }
}

export function FichaAbas({ midia }: { midia: Midia }) {
  const abaAberta = useSyncExternalStore(
    assinarAba,
    abaDoFragmento,
    abaNoServidor,
  );
  const referenciasAbas = useRef<
    Record<IdAba, HTMLButtonElement | null>
  >({
    sinopse: null,
    elenco: null,
    detalhes: null,
  });

  const selecionarAba = (id: IdAba) => {
    // A aba que já está aberta não empilha entrada: o "voltar" seguinte
    // pareceria não fazer nada.
    if (id !== abaAberta) {
      irParaAba(id);
    }

    const botao = referenciasAbas.current[id];

    if (botao !== null) {
      botao.focus();
    }
  };

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
            tabIndex={aba.id === abaAberta ? 0 : -1}
            ref={(botao) => {
              referenciasAbas.current[aba.id] = botao;
            }}
            onClick={() => selecionarAba(aba.id)}
            onKeyDown={(event) => {
              const indiceAtual = ABAS.findIndex(
                (item) => item.id === aba.id,
              );
              let indiceAlvo: number;

              switch (event.key) {
                case "ArrowRight":
                  indiceAlvo = (indiceAtual + 1) % ABAS.length;
                  break;
                case "ArrowLeft":
                  indiceAlvo =
                    (indiceAtual - 1 + ABAS.length) % ABAS.length;
                  break;
                case "Home":
                  indiceAlvo = 0;
                  break;
                case "End":
                  indiceAlvo = ABAS.length - 1;
                  break;
                default:
                  return;
              }

              event.preventDefault();
              const abaAlvo = ABAS[indiceAlvo];

              if (abaAlvo !== undefined) {
                selecionarAba(abaAlvo.id);
              }
            }}
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

      <div className="pt-6">
        {ABAS.map((aba) => (
          <div
            key={aba.id}
            role="tabpanel"
            id={`painel-${aba.id}`}
            aria-labelledby={`aba-${aba.id}`}
            tabIndex={0}
            hidden={aba.id !== abaAberta}
          >
            <PainelDaAba id={aba.id} midia={midia} />
          </div>
        ))}
      </div>
    </section>
  );
}
