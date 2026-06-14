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
};

export default nextConfig;
