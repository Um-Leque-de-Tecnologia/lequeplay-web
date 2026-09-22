/** `modal` chega como prop porque existe a pasta `@modal` aqui do lado. */
export default function LayoutDaGaleria({
    children,
    modal,
}: {
    children: React.ReactNode;
    modal: React.ReactNode;
}) {
    return (
        <>
            {children}
            {modal}
        </>
    );
}