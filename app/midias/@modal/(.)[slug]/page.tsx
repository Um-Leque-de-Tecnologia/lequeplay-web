import PaginaDaMidia from "@/app/midias/[slug]/page";
import { Modal } from "@/components/modal";

export default async function ModalPaginaDaMidia({
  params,
  searchParams,
}: PageProps<"/midias/[slug]">) {
  const { slug } = await params;

  return (
    <Modal>
      <PaginaDaMidia
        params={Promise.resolve({ slug })}
        searchParams={searchParams}
      />
    </Modal>
  );
}
