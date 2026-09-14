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

/**
 * Formata uma data ISO (ex: "2025-03-12") por extenso em português
 * (ex: "12 de março de 2025").
 *
 * É 100% determinística e imune a discrepâncias de fuso horário / hydration mismatch:
 * datas no formato YYYY-MM-DD são lidas diretamente sem conversão de fuso local,
 * garantindo que UTC-3 ou qualquer outro fuso não desloque a data para o dia anterior.
 */
export function formatarDataPorExtenso(dataIso: string): string {
  const somenteData = dataIso.split("T")[0];
  const partes = somenteData.split("-");

  if (partes.length === 3) {
    const ano = Number(partes[0]);
    const mesIndex = Number(partes[1]) - 1;
    const dia = Number(partes[2]);

    if (!Number.isNaN(ano) && mesIndex >= 0 && mesIndex < 12 && !Number.isNaN(dia)) {
      return `${dia} de ${MESES[mesIndex]} de ${ano}`;
    }
  }

  // Fallback seguro com timeZone UTC explícito
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(dataIso));
}

/** Formata minutos para formato amigável (ex: "1h 30min" ou "45min"). */
export function formatarDuracao(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h${m > 0 ? ` ${m}min` : ""}` : `${m}min`;
}
