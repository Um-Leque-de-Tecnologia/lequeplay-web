"use server";

import { redirect } from "next/navigation";
import { buscarMidia } from "@/lib/api";
import {
  gravarAssistidas,
  listarAssistidas,
  slugValido,
} from "@/lib/assistidas";

async function slugDoFormulario(formData: FormData): Promise<string> {
  const slug = formData.get("slug");

  if (!slugValido(slug)) {
    throw new Error("Slug de mídia inválido");
  }

  if (!(await buscarMidia(slug))) {
    throw new Error("Mídia não encontrada");
  }

  return slug;
}

export async function marcarComoAssistida(formData: FormData): Promise<void> {
  const slug = await slugDoFormulario(formData);
  const assistidas = await listarAssistidas();

  if (!assistidas.includes(slug)) {
    await gravarAssistidas([...assistidas, slug]);
  }

  redirect(`/midias/${slug}`);
}

export async function desmarcarComoAssistida(
  formData: FormData,
): Promise<void> {
  const slug = await slugDoFormulario(formData);
  const assistidas = await listarAssistidas();

  await gravarAssistidas(assistidas.filter((item) => item !== slug));
  redirect(`/midias/${slug}`);
}