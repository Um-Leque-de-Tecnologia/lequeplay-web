import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mídia não encontrada",
  description: "A página ou mídia solicitada não foi encontrada no catálogo.",
};

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h2 className="text-2xl font-bold">Mídia não encontrada</h2>
      <p className="text-zinc-400 mt-2">O conteúdo que você procurava não existe.</p>
    </div>
  );
}