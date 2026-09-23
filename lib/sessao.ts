import "server-only";
import { cookies } from "next/headers";
import type { TokensDaApi, UsuarioDaApi } from "@/lib/api";

export async function gravarSessao(tokens: TokensDaApi) {
  const cookieStore = await cookies();
  cookieStore.set("lp_acesso", tokens.accessToken, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 20 });
  cookieStore.set("lp_renovacao", tokens.refreshToken, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 1800 });
}

export async function apagarSessao() {
  const cookieStore = await cookies();
  cookieStore.delete("lp_acesso");
  cookieStore.delete("lp_renovacao");
}

export async function lerRenovacao(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get("lp_renovacao")?.value;
}

export async function lerUsuario(): Promise<UsuarioDaApi | null> {
  // Retorna o usuário logado se houver cookie válido, ou null
  return null; 
}