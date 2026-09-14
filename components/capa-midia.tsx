import Image from "next/image";
import type { Midia } from "@/lib/tipos";

type Props = {
  posterUrl?: Midia["posterUrl"];
  className: string;
  priority?: boolean;
};

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