import { EsqueletoCard } from "./esqueleto-card-midia";

/** O esqueleto da faixa "Em alta": mesma grade de seis da faixa real. */
export function EsqueletoHomeEmAlta() {
  return (
    <section className="mb-14">
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
        <div className="h-6 w-28 rounded bg-zinc-800" />
        <div className="h-4 w-52 rounded bg-zinc-800/50" />
      </div>

      <ul className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i}>
            <EsqueletoCard />
          </li>
        ))}
      </ul>
    </section>
  );
}
