import type { Midia } from "@/lib/tipos";

function formatarDuracao(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h${m > 0 ? ` ${m}min` : ""}` : `${m}min`;
}

/** A ficha muda conforme o tipo — e o narrowing dá o campo certo em cada caso. */
export function FichaTecnica({ midia }: { midia: Midia }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
      <dt className="text-zinc-500">Ano</dt>
      <dd>{midia.ano}</dd>

      <dt className="text-zinc-500">
        {/* O rótulo acompanha a cardinalidade: um gênero, "Gênero". */}
        {midia.generos.length > 1 ? "Gêneros" : "Gênero"}
      </dt>
      {/*
        `generos` é lista, então precisa virar texto. Separador escolhido:
        vírgula e espaço — e não " · ", que o resto da página usa. O ponto
        do meio é invisível para leitor de tela (ele lê "Drama Suspense",
        como se fosse um gênero só de nome comprido); a vírgula é lida como
        pausa e mantém a enumeração audível. Em ficha técnica, a lista
        precisa soar como lista.
      */}
      <dd>{midia.generos.join(", ")}</dd>

      {/*
        A duração pode faltar: a API omite `duracaoMin` quando não tem o
        número — na produção, toda série sem runtime na TMDB vem sem ele.
        Sem esta guarda, `formatarDuracao(undefined)` escreveria "NaNmin"
        na ficha. Some a linha inteira, `dt` junto com `dd`: uma `<dl>` com
        termo sem definição é lida como campo vazio pelo leitor de tela, o
        que é pior do que não anunciar o campo.
      */}
      {midia.duracaoMin !== undefined && (
        <>
          <dt className="text-zinc-500">Duração</dt>
          <dd>{formatarDuracao(midia.duracaoMin)}</dd>
        </>
      )}

      {midia.tipo === "filme" && (
        <>
          <dt className="text-zinc-500">Direção</dt>
          {/* Vem do crédito com `papel: "direcao"` — a API não manda o nome solto. */}
          <dd>{midia.diretor}</dd>
        </>
      )}

      {midia.tipo === "serie" && (
        <>
          <dt className="text-zinc-500">Temporadas</dt>
          <dd>{midia.temporadas.length}</dd>
        </>
      )}

      {midia.tipo === "podcast" && (
        <>
          <dt className="text-zinc-500">Apresentação</dt>
          {/* Idem: crédito com `papel: "apresentacao"`. */}
          <dd>{midia.apresentador}</dd>
        </>
      )}
    </dl>
  );
}
