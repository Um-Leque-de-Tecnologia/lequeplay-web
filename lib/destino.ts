export function destinoSeguro(caminho: unknown): string {
  if (typeof caminho === "string" && caminho.startsWith("/") && !caminho.startsWith("//")) {
    return caminho;
  }
  return "/";
}