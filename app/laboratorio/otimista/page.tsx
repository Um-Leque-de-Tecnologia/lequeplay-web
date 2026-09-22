import { Estrelas } from "./estrelas";

export default function PaginaOtimista() {
    return (
        <main className="space-y-4 p-8">
            <h1 className="text-2xl font-semibold">Mostrar antes de saber</h1>
            <Estrelas slug="dark" nota={0} />
        </main>
    );
}