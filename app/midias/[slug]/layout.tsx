export default async function MidiaLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <article>
      {/* Cabeçalho e elementos fixos aqui */}
      
      {/* O children renderiza a página da temporada correspondente */}
      <div>{children}</div>
    </article>
  );
}