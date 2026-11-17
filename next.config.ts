import type { NextConfig } from "next";

// cacheComponents fica desligado por enquanto: quase todas as telas da Plateia
// dependem do usuário logado, e isso simplifica a publicação na Cloudflare.
const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
