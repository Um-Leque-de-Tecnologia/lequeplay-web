import { lerCurtidas } from "./acoes";
import { BotoesDeCurtida } from "./botoes";

export default async function PaginaDaResposta() {
    const total = await lerCurtidas();

    return (
        <main className="space-y-4 p-8">
            <h1 className="text-2xl font-semibold">Uma resposta, dado e tela</h1>
            <p className="text-4xl font-bold">{total}</p>
            <p className="text-sm text-zinc-400">
                Este número foi desenhado no servidor.
            </p>
            <BotoesDeCurtida />
        </main>
    );
}