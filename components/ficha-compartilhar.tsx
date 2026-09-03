/**
 * O endereço público do site.
 *
 * O link de compartilhar tem que ser **absoluto**: ele sai daqui para fora —
 * colado numa conversa, num e-mail, num post — e `/midias/slug` sozinho não
 * leva a lugar nenhum fora do navegador de quem copiou.
 */
import { BotaoCopiarLink } from "@/components/botao-copiar-link";

const SITE = "http://localhost:3000";

export function FichaCompartilhar({
  slug,
  titulo,
}: {
  slug: string;
  titulo: string;
}) {
  const url = `${SITE}/midias/${slug}`;

  return (
    <section aria-labelledby="compartilhar" className="mt-12">
      <h2 id="compartilhar" className="mb-3 text-xl font-semibold">
        Compartilhar
      </h2>

      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="link" className="sr-only">
          Link de {titulo}
        </label>
        {/*
          `readOnly` e não `disabled`: campo desabilitado sai da ordem de
          tabulação e o leitor de tela pula, então quem não usa o botão
          perderia o link. Somente-leitura continua focável e selecionável.
        */}
        <input
          id="link"
          type="text"
          readOnly
          value={url}
          className="min-w-72 flex-1 rounded-md border border-white/15 bg-zinc-900 px-3 py-2 text-sm text-zinc-400"
        />
        <BotaoCopiarLink />
      </div>
    </section>
  );
}
