import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(import.meta.dirname),
  },
  // Imprime cada chamada a fetch() no terminal em desenvolvimento,
  // exibindo a URL completa e o status de cache (HIT, MISS, SKIP).
  logging: {
    fetches: {
      fullUrl: true,
    },
  },  
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
      },
    ],
  },
};

export default nextConfig;