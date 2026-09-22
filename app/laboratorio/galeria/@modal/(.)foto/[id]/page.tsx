import { Modal } from "../../../modal";
import { Foto } from "../../../foto";

/** O `(.)foto` intercepta `/laboratorio/galeria/foto/[id]` no clique.
 *  O conteúdo é o MESMO da página inteira — só a moldura muda. */
export default async function FotoNoModal({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    return (
        <Modal>
            <Foto id={id} />
        </Modal>
    );
}