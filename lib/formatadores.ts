/**
 * Como o LequePlay escreve data, hora e duração — num lugar só.
 *
 * ## O fuso de referência é o UTC
 *
 * Data formatada é onde o Next morde: o servidor roda com um fuso, o
 * navegador de quem lê roda com outro, e `new Date(...).toLocaleDateString()`
 * devolve textos diferentes nos dois. O HTML sai com um, o React pinta outro,
 * e aparece o aviso de hidratação — quando aparece, porque o caso silencioso
 * é pior: um episódio publicado às 21h de 12/03 vira "13 de março" para quem
 * está em UTC+3, e ninguém percebe.
 *
 * A saída é não deixar o ambiente decidir. Todo o acervo é formatado **em
 * UTC**, que é o fuso em que a API publica (`publicadoEm` vem como data ISO,
 * sem hora). Datas do acervo são a data que a emissora anunciou, e não um
 * instante no tempo: elas não devem mudar de dia conforme quem olha.
 *
 * O dia em que existir hora de exibição — "estreia às 21h" — aí sim o fuso
 * passa a ser informação do dado, e este módulo ganha uma segunda função que
 * recebe o fuso junto.
 */

const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
] as const;

/** O fuso de referência do acervo. Veja o bloco no topo do arquivo. */
export const FUSO_DO_ACERVO = "UTC";

/**
 * Data ISO (`2025-03-12`) por extenso em português: "12 de março de 2025".
 *
 * Lê as partes da string direto, sem passar por `new Date`, porque
 * `new Date("2025-03-12")` é interpretado como meia-noite **UTC** e, impresso
 * no fuso local de quem renderiza, volta como 11 de março em qualquer lugar a
 * oeste de Greenwich. Ler `"2025"`, `"03"` e `"12"` como texto não tem fuso
 * nenhum para errar, e dá o mesmo resultado no servidor e no navegador.
 *
 * Data fora do formato esperado devolve o texto cru em vez de quebrar: o
 * `Intl.format` lança `RangeError` com data inválida, e como isto roda no
 * servidor, o erro derrubaria a rota inteira por causa de uma linha de
 * episódio.
 */
export function formatarDataPorExtenso(dataIso: string): string {
  const somenteData = dataIso.split("T")[0];
  const partes = somenteData.split("-");

  if (partes.length === 3) {
    const ano = Number(partes[0]);
    const mesIndex = Number(partes[1]) - 1;
    const dia = Number(partes[2]);

    if (
      !Number.isNaN(ano) &&
      !Number.isNaN(dia) &&
      mesIndex >= 0 &&
      mesIndex < 12
    ) {
      return `${dia} de ${MESES[mesIndex]} de ${ano}`;
    }
  }

  const data = new Date(dataIso);
  if (Number.isNaN(data.getTime())) return dataIso;

  // Chegou aqui com data válida em outro formato (com hora, por exemplo):
  // formata com o fuso fixo, pelo mesmo motivo do bloco do topo.
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: FUSO_DO_ACERVO,
  }).format(data);
}

/**
 * Duração em minutos como o brasileiro lê: **`1h47`**, e `47min` abaixo de
 * uma hora.
 *
 * Os minutos vão com dois dígitos quando há hora (`2h05`, e não `2h5`):
 * `2h5` se lê como "duas horas e cinco" só depois de um instante de dúvida,
 * e a coluna fica desalinhada numa lista.
 *
 * Zero minutos devolve `0min` em vez de string vazia — quem chama decide se
 * esconde a linha, e é o que a ficha faz quando o campo nem vem.
 */
export function formatarDuracao(minutos: number): string {
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;

  if (horas === 0) return `${resto}min`;

  return `${horas}h${String(resto).padStart(2, "0")}`;
}

/**
 * Como a temporada se chama na tela: o `nome` que a API manda, e, sem ele,
 * "Temporada 2" — nunca `undefined` nem espaço em branco (LP-305).
 *
 * A `0` é a de especiais (veja `ResumoTemporada.numero`): "Temporada 0" não é
 * como ninguém fala dela. A API publicada hoje não tem temporada 0 — a
 * ingestão ignora especiais —, mas o mock tem, e o tipo permite.
 *
 * O ano não entra aqui: ele é opcional, e cada tela decide como encaixá-lo
 * (entre parênteses no seletor, depois de um "·" no cabeçalho). Colado no
 * rótulo, a ausência dele sobraria como "()" em algum lugar.
 */
export function rotuloDaTemporada(temporada: {
  numero: number;
  nome?: string;
}): string {
  const nome = temporada.nome?.trim();
  if (nome) return nome;

  return temporada.numero === 0 ? "Especiais" : `Temporada ${temporada.numero}`;
}
