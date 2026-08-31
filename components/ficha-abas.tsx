import { FichaTecnica } from "@/components/ficha-tecnica";
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
 * Sai daqui e não da URL de propósito: aba aberta é estado de leitura, não
 * endereço. No dia em que a ficha precisar de link direto para o elenco
 * (`/midias/slug#elenco`), é esta função que passa a ler o fragmento — e só
 * ela.
 */
function abaInicial(): IdAba | null {
  return null;
}

/** O elenco sai de `creditos`; a API não manda uma lista de atores solta. */
function Elenco({ creditos }: { creditos: Credito[] | undefined }) {
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
  const abaAberta = abaInicial();

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
        {abaAberta !== null && (
          <div
            role="tabpanel"
            id={`painel-${abaAberta}`}
            aria-labelledby={`aba-${abaAberta}`}
          >
            <PainelDaAba id={abaAberta} midia={midia} />
          </div>
        )}
      </div>
    </section>
  );
}
