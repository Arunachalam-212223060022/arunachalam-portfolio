import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  images: {
    formats: ["image/webp"],
    deviceSizes: [640, 900, 1200],
  },
  experimental: {
    optimizeCss: true,
  },
  headers: async () => [
    {
      source: "/images/:path*",
      headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
    },
    {
      source: "/resume/:path*",
      headers: [{ key: "Cache-Control", value: "public, max-age=86400" }],
    },
  ],
};

export default nextConfig;
