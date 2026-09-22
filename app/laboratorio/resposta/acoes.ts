"use server";

import { revalidatePath } from "next/cache";

export async function curtirAvisando() {
  curtidas += 1;
  // ESTA linha é o passo inteiro: ela faz a resposta trazer a tela nova junto.
  revalidatePath("/laboratorio/resposta");
  return curtidas;
}

/** Laboratório da aula 05 (descartável). Conceito: UMA IDA, DUAS COISAS. */

let curtidas = 0;

export async function curtirSemAvisar() {
  curtidas += 1;
  // Nenhum aviso ao Next: a resposta traz só isto, e a tela continua velha.
  return curtidas;
}

export async function lerCurtidas() {
  return curtidas;
}