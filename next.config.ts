import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  devIndicators: false,
  allowedDevOrigins: ["*.e2b.app", "127.0.0.1", "localhost"],
  turbopack: { root: fileURLToPath(new URL(".", import.meta.url)) },
};

export default nextConfig;
