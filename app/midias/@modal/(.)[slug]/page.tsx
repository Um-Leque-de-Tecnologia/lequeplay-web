import PaginaDaMidia from "@/app/midias/[slug]/page";
import { Modal } from "@/components/modal";

export default function ModalPaginaDaMidia({
  params,
  searchParams,
}: PageProps<"/midias/[slug]">) {
  return (
    <Modal>
      <PaginaDaMidia params={params} searchParams={searchParams} />
    </Modal>
  );
}
