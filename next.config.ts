import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sem isto, o Turbopack sobe a árvore procurando lockfile e pode achar um
  // package-lock.json perdido na sua pasta de usuário — aí ele trata a home
  // inteira como raiz do projeto e avisa a cada build. Fixar a raiz aqui
  // resolve na sua máquina e na de todo mundo.
  turbopack: {
    root: path.resolve(import.meta.dirname),
  },
};

export default nextConfig;
