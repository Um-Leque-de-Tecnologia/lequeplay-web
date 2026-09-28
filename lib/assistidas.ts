import "server-only";

import { cookies } from "next/headers";
import { NOMES_DOS_COOKIES } from "@/lib/nomes-dos-cookies";

const COOKIE_ASSISTIDAS = NOMES_DOS_COOKIES.assistidas;
const OPCOES_DO_COOKIE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
};

export function slugValido(slug: unknown): slug is string {
  return (
    typeof slug === "string" &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
  );
}

export async function listarAssistidas(): Promise<string[]> {
  const valor = (await cookies()).get(COOKIE_ASSISTIDAS)?.value;

  if (valor === undefined) return [];

  try {
    const slugs: unknown = JSON.parse(valor);

    if (!Array.isArray(slugs)) return [];

    return slugs.filter(slugValido);
  } catch {
    return [];
  }
}

export async function gravarAssistidas(slugs: string[]): Promise<void> {
  const cookieStore = await cookies();

  if (slugs.length === 0) {
    cookieStore.delete(COOKIE_ASSISTIDAS);
    return;
  }

  cookieStore.set(COOKIE_ASSISTIDAS, JSON.stringify(slugs), OPCOES_DO_COOKIE);
}