import PaginaDaMidia from "@/app/midias/[slug]/page";
import { ModalRota } from "@/components/modal-rota";

export default async function PaginaDeFichaNoModal({
  params,
  searchParams,
}: PageProps<"/midias/[slug]">) {
  const { slug } = await params;

  return (
    <ModalRota titulo={`Ficha de ${slug}`}>
      <PaginaDaMidia
        params={Promise.resolve({ slug })}
        searchParams={searchParams}
      />
    </ModalRota>
  );
}
