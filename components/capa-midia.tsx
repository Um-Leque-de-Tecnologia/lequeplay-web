import Image from "next/image";
import type { Midia } from "@/lib/tipos";

type Props = {
  posterUrl?: Midia["posterUrl"];
  className: string;
  priority?: boolean;
};

/**
 * A capa de um título, com o mesmo fallback em toda tela que a mostra.
 *
 * `??` e não `||`: o `??` só troca `null`/`undefined`, o `||` troca qualquer
 * valor falso — e `""` vindo da API é dado sujo, não "sem capa"; com `||` o
 * bug viraria uma capa bonitinha e ninguém veria. O campo mudou de
 * `capaUrl: string | null` para `posterUrl?: string` (a API OMITE quando não
 * há capa, em vez de mandar `null`), e o `??` sobreviveu à troca justamente
 * porque ele já pegava `undefined`.
 *
 * `width` e `height` moram aqui, e não em quem chama: são a proporção 2:3 do
 * pôster, e é o par deles que evita a página "pular" quando a imagem carrega.
 * O tamanho na tela continua sendo decisão de cada contexto, pelo `className`.
 */
export function CapaMidia({ posterUrl, className, priority }: Props) {
  return (
    <Image
      src={posterUrl ?? "/capas/sem-capa.svg"}
      alt=""
      width={300}
      height={450}
      className={className}
      priority={priority}
    />
  );
}
