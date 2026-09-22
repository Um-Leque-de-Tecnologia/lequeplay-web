import { Foto } from "../../foto";

export default async function PaginaDaFoto({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    return <main className="p-8"><Foto id={id} /></main>;
}