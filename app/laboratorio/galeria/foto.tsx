// app/laboratorio/galeria/foto.tsx
export function Foto({ id }: { id: string }) {
    return (
        <>
            <h2 className="text-xl font-semibold">Foto {id}</h2>
            <div className="mt-3 h-48 w-64 rounded-lg bg-violet-900" />
        </>
    );
}