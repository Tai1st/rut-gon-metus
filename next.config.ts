import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Trang /s/[code] và API proxy luôn chạy động ở server; không bật Cache Components để tránh cache nhầm.
  cacheComponents: false,
  partialPrefetching: false,
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
