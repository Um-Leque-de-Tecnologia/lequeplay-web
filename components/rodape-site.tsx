import Link from "next/link";
import { RodapeVoltarAoTopo } from "@/components/rodape-voltar-ao-topo";
/** A faixa que fecha toda página: crédito e os links que não são catálogo. */
export function RodapeSite() {
  const ano = new Date().getFullYear();
  return (
    <footer className="border-t border-white/10">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-6 text-sm text-zinc-500">
        <p>© {ano} LequePlay — projeto do curso Next.js + IA</p>

        <nav aria-label="Rodapé">
          <Link href="/sobre" className="transition hover:text-zinc-300">
            Sobre o LequePlay
          </Link>
        </nav>
      </div>
      {/*
        Mora aqui e não no layout porque ele é assunto do rodapé: quem
        procura o "voltar ao topo" procura no fim da página, no código
        também.
      */}
      <RodapeVoltarAoTopo />
    </footer>
  );
}
