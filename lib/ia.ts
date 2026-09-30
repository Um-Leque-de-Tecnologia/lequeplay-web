import "server-only";

/**
 * A única porta de entrada para o Gemini no LequePlay (LP-701).
 *
 * O `server-only` garante que este módulo nunca seja empacotado para o cliente.
 * Se qualquer componente com "use client" importar este arquivo, o build quebra.
 */

const GEMINI = process.env.GEMINI_URL ?? "https://generativelanguage.googleapis.com";
const CHAVE = process.env.GEMINI_API_KEY;

export const MODELO = "gemini-3.5-flash-lite";

type Parte = { text?: string; thought?: boolean };

function pedidoAoModelo(sistema: string, texto: string) {
  if (!CHAVE) {
    throw new Error("falta GEMINI_API_KEY no .env.local");
  }

  return {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": CHAVE },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: sistema }] },
      contents: [{ role: "user", parts: [{ text: texto }] }],
    }),
  };
}

/** Extrai o texto da resposta descartando blocos de pensamento. */
function textoDas(partes: Parte[] = []) {
  return partes
    .filter((p) => !p.thought)
    .map((p) => p.text ?? "")
    .join("");
}

/** Envia o prompt ao modelo e aguarda a resposta completa. */
export async function perguntar(sistema: string, texto: string) {
  const resposta = await fetch(
    `${GEMINI}/v1beta/models/${MODELO}:generateContent`,
    pedidoAoModelo(sistema, texto),
  );

  if (!resposta.ok) {
    throw new Error(`o Gemini respondeu ${resposta.status}`);
  }

  const dados = await resposta.json();
  return textoDas(dados.candidates?.[0]?.content?.parts);
}