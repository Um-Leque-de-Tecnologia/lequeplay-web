export const CACHE_TAGS = {
  MIDIAS: "midias",
  GENEROS: "generos",
} as const;

export function tagMidia(slug: string): string {
  return `midia:${slug}`;
}