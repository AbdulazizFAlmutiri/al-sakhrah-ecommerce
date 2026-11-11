import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // ops/ has its own lockfile; stop Next from treating the marketing site as the workspace root.
  outputFileTracingRoot: path.join(__dirname),
  turbopack: { root: path.join(__dirname) },
};

export default nextConfig;
