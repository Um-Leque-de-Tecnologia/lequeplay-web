import Link from "next/link";

export default function Galeria() {
    return (
        <main className="p-8">
            <h1 className="mb-4 text-2xl font-semibold">Galeria</h1>
            <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                    <Link key={n} href={`/laboratorio/galeria/foto/${n}`}
                        className="grid h-32 place-items-center rounded-lg bg-zinc-800">
                        {n}
                    </Link>
                ))}
            </div>
        </main>
    );
}